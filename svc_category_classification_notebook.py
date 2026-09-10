# Databricks notebook source
# MAGIC %md
# MAGIC # Professional Services — Service Category Classification
# MAGIC
# MAGIC Classifies AP invoice lines into the 14-category service taxonomy. Everything is
# MAGIC deterministic and inspectable: the knowledge learned from the human review lives
# MAGIC in a Delta rules table you can query and hand-edit, not in code.
# MAGIC
# MAGIC **No LLM in the active path.** `llm_available` defaults to `false`; the T7 tier
# MAGIC is wired but guarded and cannot fire. Flip the widget when the endpoint is approved.
# MAGIC
# MAGIC ### Flow
# MAGIC ```
# MAGIC   bootstrap (once)          mine_rules              score              review
# MAGIC   Jun/Jul + Action  ->  labeled_history  ->  svc_cat_rules  ->  classified  ->  review_queue
# MAGIC                                ^              tier_accuracy       run_summary        |
# MAGIC                                +---------------- CORRECTED_CATEGORY ----------------+
# MAGIC ```
# MAGIC
# MAGIC ### Tiers, with measured forward-test accuracy
# MAGIC | Tier | Source | Accuracy | Confidence |
# MAGIC |---|---|---|---|
# MAGIC | T0 | manual rule — hand-written, always wins | — | High |
# MAGIC | T1 | vendor + expense + taxonomy | 99.5% | High / Medium |
# MAGIC | T2 | vendor + expense | 25% | Medium |
# MAGIC | T3 | specific expense description | 97.7% | High |
# MAGIC | T4 | vendor keyword — strong / weak | 98.3% / 62.5% | High / Medium |
# MAGIC | T5 | vendor history | 52.8% | Medium |
# MAGIC | T6 | statistical fallback + override | 77.5% / 100% | by probability |
# MAGIC | T7 | LLM adjudication — **disabled** | not measured | Medium |
# MAGIC
# MAGIC ### Multiple months in one run
# MAGIC The input can hold any number of months. They are detected from the `MONTH`
# MAGIC column, ordered by calendar (not string sort), and scored one at a time so each
# MAGIC gets its own output rows, review queue and summary. Re-running a batch is
# MAGIC idempotent — a month's earlier rows are cleared before its new ones land.
# MAGIC
# MAGIC ### Scale
# MAGIC Classification is vectorized — merges and regex over unique vendors, no per-row
# MAGIC Python. Benchmarked at **1.06M lines in 4 seconds, 620 MB peak**. Inputs above
# MAGIC `chunk_rows` are processed in vendor-hash buckets so memory stays flat regardless
# MAGIC of input size. The statistical fallback only runs on lines the rules declined —
# MAGIC typically 1–2% — so it never becomes the bottleneck.

# COMMAND ----------

# MAGIC %md ## 1. Parameters

# COMMAND ----------

dbutils.widgets.dropdown("run_mode", "both", ["mine_rules", "score", "both"])
dbutils.widgets.dropdown("llm_available", "false", ["false", "true"])
dbutils.widgets.text("catalog", "")
dbutils.widgets.text("schema", "")
dbutils.widgets.text("history_table", "svc_cat_labeled_history")
dbutils.widgets.text("rules_table", "svc_cat_rules")
dbutils.widgets.text("accuracy_table", "svc_cat_tier_accuracy")
dbutils.widgets.text("input_table", "")
dbutils.widgets.text("output_table", "svc_cat_classified_lines")
dbutils.widgets.text("queue_table", "svc_cat_review_queue")
dbutils.widgets.text("summary_table", "svc_cat_run_summary")
dbutils.widgets.text("bootstrap_table", "")
dbutils.widgets.text("run_month", "")
dbutils.widgets.text("chunk_rows", "2000000")
dbutils.widgets.dropdown("overwrite_month", "true", ["true", "false"])
dbutils.widgets.dropdown("sequential_learning", "false", ["false", "true"])
dbutils.widgets.text("llm_endpoint", "databricks-meta-llama-3-3-70b-instruct")

RUN_MODE      = dbutils.widgets.get("run_mode").strip()
LLM_AVAILABLE = dbutils.widgets.get("llm_available").strip().lower() == "true"
CATALOG       = dbutils.widgets.get("catalog").strip()
SCHEMA        = dbutils.widgets.get("schema").strip()
HISTORY_TBL   = dbutils.widgets.get("history_table").strip()
RULES_TBL     = dbutils.widgets.get("rules_table").strip()
ACC_TBL       = dbutils.widgets.get("accuracy_table").strip()
INPUT_TBL     = dbutils.widgets.get("input_table").strip()
OUTPUT_TBL    = dbutils.widgets.get("output_table").strip()
QUEUE_TBL     = dbutils.widgets.get("queue_table").strip()
SUMMARY_TBL   = dbutils.widgets.get("summary_table").strip()
BOOTSTRAP_TBL = dbutils.widgets.get("bootstrap_table").strip()
RUN_MONTH     = dbutils.widgets.get("run_month").strip()
CHUNK_ROWS    = int(dbutils.widgets.get("chunk_rows").strip() or 2_000_000)
OVERWRITE_MONTH = dbutils.widgets.get("overwrite_month").strip().lower() == "true"
SEQUENTIAL      = dbutils.widgets.get("sequential_learning").strip().lower() == "true"
LLM_ENDPOINT  = dbutils.widgets.get("llm_endpoint").strip()

if not (CATALOG and SCHEMA):
    raise ValueError("catalog and schema are required")

FQ = lambda t: f"{CATALOG}.{SCHEMA}.{t}"
spark.sql(f"USE CATALOG {CATALOG}")
spark.sql(f"USE SCHEMA {SCHEMA}")

RUN_ID = f"{RUN_MONTH or 'run'}_{pd.Timestamp.utcnow().strftime('%Y%m%d%H%M%S')}" if False else None
print(f"mode={RUN_MODE}  llm_available={LLM_AVAILABLE}  month={RUN_MONTH or 'from input'}  "
      f"chunk_rows={CHUNK_ROWS:,}  overwrite_month={OVERWRITE_MONTH}  sequential={SEQUENTIAL}")

# COMMAND ----------

# MAGIC %md ## 2. Taxonomy and learned patterns
# MAGIC
# MAGIC These constants seed the rules table on the first run. After that, change
# MAGIC behaviour by editing rows in Delta rather than editing this notebook.

# COMMAND ----------

import re
import numpy as np
import pandas as pd

RUN_ID = f"{RUN_MONTH or 'run'}_{pd.Timestamp.utcnow().strftime('%Y%m%d%H%M%S')}"

FEATURES = ["VENDOR_NORMALIZED", "EXTC_DESCRIPTION", "SPEND_USD",
            "AID_TAXONOMY_LEVEL1", "AID_TAXONOMY_LEVEL2"]

LABELS = ["Not in scope", "Unknown", "IT Services", "Management Consulting",
          "Taxation Services", "Accounting Services", "Audit Services",
          "Marketing Consulting", "Lobbying Services", "HR Consulting",
          "Legal Services", "Financial Services", "Other Consulting", "OTHERS"]

CANON = {
    "not in scope": "Not in scope", "Unknown": "Unknown",
    "Move to IT Services": "IT Services",
    "Move to Management Consulting": "Management Consulting",
    "ACCOUNTING SERVICES": "Accounting Services", "LEGAL SERVICES": "Legal Services",
    "Lobbying": "Lobbying Services",
}
CANON.update({l: l for l in LABELS})

# Expense buckets that describe the booking, not the service. A vendor keyword firing
# on one of these is what turned 3,959 intercompany lines into Financial Services in
# the prior engine, so keywords are suppressed here.
GENERIC_EXTC = [
    "Contract Svcs/Prof Fees-Non-NPW-Other", "Corporate Entry - Other",
    "Other Professional Services", "Other Business Costs",
    "Outsourcing – Third Parties/Agents", "Tuition Aid",
    "Other COGS- Contract Labor", "Contract Labor (Excl Installation)", "Training",
    "Adv-Other/Consulting Services", "Research & Development",
    "Computer Maintenance & Repair", "Financial & Accounting Services",
    "Audit Services & Fees", "Time Share Charges",
]

# Named firms and unambiguous terms — safe even on a generic bucket.
KEYWORD_STRONG = [
    (r"\bKPMG\b|DELOITTE|ERNST\s*(?:&|AND)\s*YOUNG|\bEY LLP\b|GRANT THORNTON|\bBDO\b", "Audit Services"),
    (r"MCKINSEY|\bBAIN\b|BOSTON CONSULTING|OLIVER WYMAN|BOOZ|\bA\.?T\.? KEARNEY\b", "Management Consulting"),
    (r"\bTAX\b|\bTAXATION\b", "Taxation Services"),
    (r"LOBBY|GOVERNMENT AFFAIRS|LEGISLATIVE|PUBLIC AFFAIRS|POLICY GROUP", "Lobbying Services"),
    (r"UNIVERSITY|\bUNIV\b|COLLEGE|UMASS|ACADEMY|\bSCHOOL\b", "Not in scope"),
]
# Generic words — only trusted when the expense description is specific.
KEYWORD_WEAK = [
    (r"\b(?:LAW|LEGAL|ATTORNEY|ATTORNEYS|COUNSEL|PLLC|LLP|BARRISTER|SOLICITOR)\b|LAW (?:FIRM|GROUP|OFFICE)", "Legal Services"),
    (r"\b(?:MARKETING|ADVERTISING|BRAND)\b", "Marketing Consulting"),
    (r"\b(?:RECRUIT|TALENT|HUMAN RESOURCE|PAYROLL)\b", "HR Consulting"),
    (r"\b(?:ACCOUNTING|ACCOUNTANTS|CPA)\b", "Accounting Services"),
]

MIN_PURITY     = 0.80   # a mined lookup must be this consistent to become a rule
HIGH_PURITY    = 0.95   # above this a rule is High confidence
VENDOR_PURITY  = 0.90   # vendor-only rules need more evidence
MODEL_OVERRIDE = 0.98   # fallback this confident beats an impure lookup

HISTORY_COLS = ["MONTH"] + FEATURES + ["SERVICE_CATEGORY"]
RULE_SCHEMA = ["RULE_ID", "TIER", "RULE_TYPE", "MATCH_VENDOR", "MATCH_EXTC",
               "MATCH_L2", "CATEGORY", "SUPPORT", "PURITY", "SOURCE", "NOTE"]
# columns this notebook produces; stripped from any input that already carries them
OUTPUT_COLS = ["SERVICE_CATEGORY", "RULE_APPLIED", "CONFIDENCE", "SCORE",
               "IS_NEW_VENDOR", "RUN_ID", "SCORED_AT", "Action", "CORRECTED_CATEGORY"]

# COMMAND ----------

# MAGIC %md ## 3. Helpers
# MAGIC
# MAGIC Reads are probed eagerly. On Spark Connect a lazy read inside `try/except`
# MAGIC resolves later and silently poisons whatever consumed it, so every optional read
# MAGIC forces analysis with `.limit(0).count()` first. No `cache()` — serverless doesn't
# MAGIC support it; stages materialize to Delta instead.

# COMMAND ----------

from pyspark.sql import functions as F


def table_exists(fq_name):
    try:
        spark.read.table(fq_name).limit(0).count()
        return True
    except Exception as exc:
        print(f"[info] {fq_name} not readable ({type(exc).__name__})")
        return False


def check_columns(fq_name, required):
    sdf = spark.read.table(fq_name)
    sdf.limit(0).count()
    missing = [c for c in required if c not in sdf.columns]
    if missing:
        raise ValueError(f"{fq_name} missing {missing}; has {sdf.columns}")
    return sdf


def read_pdf(fq_name, required=FEATURES):
    pdf = check_columns(fq_name, required).toPandas()
    if not len(pdf):
        raise ValueError(f"{fq_name} returned zero rows")
    print(f"[read] {fq_name}: {len(pdf):,} rows")
    return pdf


def write_delta(pdf, fq_name, mode="overwrite", partition=None):
    if not len(pdf):
        print(f"[write] {fq_name}: nothing to write")
        return
    w = spark.createDataFrame(pdf).write.format("delta").mode(mode).option("mergeSchema", "true")
    if partition:
        w = w.partitionBy(partition)
    w.saveAsTable(fq_name)
    print(f"[write] {fq_name}: {len(pdf):,} rows ({mode})")


def prep(df):
    d = pd.DataFrame(index=df.index)
    d["ven"] = df.VENDOR_NORMALIZED.fillna("UNKNOWN").astype(str).str.upper().str.strip()
    d["ext"] = df.EXTC_DESCRIPTION.fillna("").astype(str)
    d["l1"] = df.AID_TAXONOMY_LEVEL1.fillna("").astype(str)
    d["l2"] = df.AID_TAXONOMY_LEVEL2.fillna("").astype(str)
    d["amt"] = pd.to_numeric(df.SPEND_USD, errors="coerce").fillna(0.0)
    return d


MONTH_RE = re.compile(r"^([A-Z]{3})[-/ ]?(\d{2,4})$")
MONTH_ABBR = {m: i for i, m in enumerate(
    ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"], 1)}


def month_key(label):
    """Sort MMM-YY / MMM-YYYY chronologically; anything else sorts last, by string."""
    m = MONTH_RE.match(str(label).strip().upper())
    if not m or m.group(1) not in MONTH_ABBR:
        return (9999, 99, str(label))
    yy = int(m.group(2))
    return (2000 + yy if yy < 100 else yy, MONTH_ABBR[m.group(1)], "")


def sorted_months(values):
    return sorted({v for v in pd.Series(values).dropna().unique()}, key=month_key)


def build_gold(df):
    """Training label. Precedence: CORRECTED_CATEGORY > Action > SERVICE_CATEGORY."""
    if "SERVICE_CATEGORY" not in df.columns:
        raise ValueError("build_gold needs SERVICE_CATEGORY")
    gold = df["SERVICE_CATEGORY"].map(CANON)
    for col in ("Action", "CORRECTED_CATEGORY"):
        if col in df.columns:
            gold = df[col].map(CANON).fillna(gold)
    if gold.isna().any():
        bad = df.loc[gold.isna(), "SERVICE_CATEGORY"].dropna().unique()[:5]
        raise ValueError(f"Unmapped labels: {list(bad)}")
    return gold


def freeze_history(df, gold=None, month=None):
    gold = build_gold(df) if gold is None else pd.Series(np.asarray(gold), index=df.index)
    out = df.reindex(columns=[c for c in HISTORY_COLS if c in df.columns]).copy()
    if "MONTH" not in out.columns:
        out.insert(0, "MONTH", month or RUN_MONTH or "")
    out["SERVICE_CATEGORY"] = gold.values
    return out.reindex(columns=HISTORY_COLS)

# COMMAND ----------

# MAGIC %md ## 4. Mine the rules
# MAGIC
# MAGIC Turns the labeled history into explicit rows, each carrying its own support count
# MAGIC and purity so a reviewer can see why a line was classified and how much evidence
# MAGIC stood behind it. Mining is a groupby-size plus idxmax, not a per-group lambda —
# MAGIC 16x faster and flat in history size.
# MAGIC
# MAGIC Hand-written rules survive re-mining: insert a row with `SOURCE = 'manual'` and it
# MAGIC becomes T0, outranking everything mined.

# COMMAND ----------


def mine_rules(history, gold):
    d = prep(history)
    d["_g"] = np.asarray(gold)
    rows = []

    def mine(keys, tier, rule_type, min_purity=MIN_PURITY):
        c = d.groupby(keys + ["_g"], observed=True).size().rename("SUPPORT").reset_index()
        c["PURITY"] = c.SUPPORT / c.groupby(keys, observed=True).SUPPORT.transform("sum")
        best = c.sort_values("SUPPORT").drop_duplicates(keys, keep="last")
        best = best[best.PURITY >= min_purity]
        out = pd.DataFrame({
            "TIER": tier, "RULE_TYPE": rule_type,
            "MATCH_VENDOR": best["ven"] if "ven" in keys else "",
            "MATCH_EXTC": best["ext"] if "ext" in keys else "",
            "MATCH_L2": best["l2"] if "l2" in keys else "",
            "CATEGORY": best["_g"].values,
            "SUPPORT": best.SUPPORT.astype(int).values,
            "PURITY": best.PURITY.round(4).values,
            "SOURCE": "mined", "NOTE": "",
        })
        rows.append(out)

    mine(["ven", "ext", "l2"], "T1", "vendor_extc_l2")
    mine(["ven", "ext"], "T2", "vendor_extc")
    mine(["ext"], "T3", "extc")
    mine(["ven"], "T5", "vendor")

    curated = []
    for pat, cat in KEYWORD_STRONG:
        curated.append(("T4", "keyword_strong", pat, "", "", cat, 0, 0.95, "curated",
                        "named firm or unambiguous term; trusted on generic buckets"))
    for pat, cat in KEYWORD_WEAK:
        curated.append(("T4", "keyword_weak", pat, "", "", cat, 0, 0.78, "curated",
                        "generic word; suppressed on generic expense buckets"))
    for e in GENERIC_EXTC:
        curated.append(("T4", "generic_extc", "", e, "", "", 0, 0.0, "curated",
                        "describes the booking, not the service; suppresses vendor keywords"))
    rows.append(pd.DataFrame(curated, columns=["TIER", "RULE_TYPE", "MATCH_VENDOR", "MATCH_EXTC",
                                               "MATCH_L2", "CATEGORY", "SUPPORT", "PURITY",
                                               "SOURCE", "NOTE"]))

    rules = pd.concat(rows, ignore_index=True)
    rules.insert(0, "RULE_ID", [f"R{i:07d}" for i in range(1, len(rules) + 1)])
    return rules.reindex(columns=RULE_SCHEMA)


def rules_to_frames(r):
    """Rules table -> merge-ready frames. Manual rows stay separate as T0."""
    r = r.fillna({"MATCH_VENDOR": "", "MATCH_EXTC": "", "MATCH_L2": "", "CATEGORY": ""})
    is_manual = r.SOURCE.astype(str).str.lower() == "manual"
    mined = r[~is_manual]

    def frame(rule_type, keys, source=mined):
        s = source[source.RULE_TYPE == rule_type]
        out = s[[k[0] for k in keys] + ["CATEGORY", "PURITY"]].copy()
        out.columns = [k[1] for k in keys] + ["cat", "pur"]
        out["pur"] = pd.to_numeric(out["pur"], errors="coerce").fillna(0.0)
        return out.drop_duplicates(subset=[k[1] for k in keys])

    man = r[is_manual]
    manual = man[["MATCH_VENDOR", "MATCH_EXTC", "MATCH_L2", "CATEGORY"]].copy()
    manual.columns = ["ven", "ext", "l2", "cat"]
    manual = manual.drop_duplicates(subset=["ven", "ext", "l2"])

    V, E, L = ("MATCH_VENDOR", "ven"), ("MATCH_EXTC", "ext"), ("MATCH_L2", "l2")
    return {
        "manual": manual,
        "vel": frame("vendor_extc_l2", [V, E, L]),
        "ve": frame("vendor_extc", [V, E]),
        "e": frame("extc", [E]),
        "v": frame("vendor", [V]),
        "generic": set(r.loc[r.RULE_TYPE == "generic_extc", "MATCH_EXTC"]),
        "strong": list(zip(r.loc[r.RULE_TYPE == "keyword_strong", "MATCH_VENDOR"],
                           r.loc[r.RULE_TYPE == "keyword_strong", "CATEGORY"])),
        "weak": list(zip(r.loc[r.RULE_TYPE == "keyword_weak", "MATCH_VENDOR"],
                         r.loc[r.RULE_TYPE == "keyword_weak", "CATEGORY"])),
    }

# COMMAND ----------

# MAGIC %md ## 5. Statistical fallback (T6) — not an LLM
# MAGIC
# MAGIC Multinomial logistic regression on vendor-name word and character n-grams, one-hot
# MAGIC expense and taxonomy, and six amount features. Fitted in-notebook against the
# MAGIC history: no external service, no endpoint, no network call.
# MAGIC
# MAGIC Amount carries real signal — lines under $100 are 43% Not in scope, lines over
# MAGIC $10k are 79% IT Services, and credits skew toward OTHERS and Unknown.

# COMMAND ----------

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression
from scipy import sparse


def amt_feats(amt):
    a = np.asarray(amt, dtype=float)
    return np.column_stack([
        np.log1p(np.abs(a)),
        (a < 0).astype(float),
        (np.abs(a) < 100).astype(float),
        (np.abs(a) >= 10_000).astype(float),
        (np.abs(a) >= 100_000).astype(float),
        (np.abs(a) == np.round(np.abs(a))).astype(float),
    ])


def fit_fallback(history, gold):
    d = prep(history)
    fb = {
        "tf_w": TfidfVectorizer(analyzer="word", ngram_range=(1, 2), min_df=2, sublinear_tf=True),
        "tf_c": TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), min_df=3, sublinear_tf=True),
        "oh": OneHotEncoder(handle_unknown="ignore"),
        "sc": StandardScaler(),
    }
    X = sparse.hstack([
        fb["tf_w"].fit_transform(d.ven), fb["tf_c"].fit_transform(d.ven),
        fb["oh"].fit_transform(d[["ext", "l1", "l2"]]),
        sparse.csr_matrix(fb["sc"].fit_transform(amt_feats(d.amt))),
    ]).tocsr()
    fb["clf"] = LogisticRegression(max_iter=4000, C=10.0).fit(X, np.asarray(gold))
    print(f"[fallback] fitted on {len(d):,} rows, {len(fb['clf'].classes_)} classes")
    return fb


def predict_fallback(d, fb, batch=200_000):
    """Batched so a large residual can't spike driver memory."""
    cats, probs = [], []
    for start in range(0, len(d), batch):
        b = d.iloc[start:start + batch]
        X = sparse.hstack([
            fb["tf_w"].transform(b.ven), fb["tf_c"].transform(b.ven),
            fb["oh"].transform(b[["ext", "l1", "l2"]]),
            sparse.csr_matrix(fb["sc"].transform(amt_feats(b.amt))),
        ]).tocsr()
        P = fb["clf"].predict_proba(X)
        cats.append(fb["clf"].classes_[P.argmax(1)])
        probs.append(P.max(1))
    if not cats:
        return np.array([], dtype=object), np.array([])
    return np.concatenate(cats), np.concatenate(probs)

# COMMAND ----------

# MAGIC %md ## 6. LLM tier (T7) — disabled
# MAGIC
# MAGIC Wired but guarded. With `llm_available = false` this returns its input untouched
# MAGIC and reports how many lines it left alone. When enabled it re-adjudicates only rows
# MAGIC still at Low confidence after T6, and it cannot invent a label outside `LABELS` —
# MAGIC anything unparseable stays as-is and goes to review.

# COMMAND ----------


def llm_adjudicate(scored, d, enabled=None, endpoint=None):
    enabled = LLM_AVAILABLE if enabled is None else enabled
    endpoint = LLM_ENDPOINT if endpoint is None else endpoint
    low = np.flatnonzero((scored.CONFIDENCE == "Low").to_numpy())

    if not enabled:
        print(f"[T7] LLM disabled — {len(low):,} Low-confidence lines left for human review")
        return scored
    if not len(low):
        return scored

    from mlflow.deployments import get_deploy_client
    client = get_deploy_client("databricks")
    allowed = ", ".join(LABELS)
    changed = 0

    for i in low:
        prompt = (
            "Classify this vendor invoice line into exactly one category.\n"
            f"Allowed categories: {allowed}\n"
            "Reply with the category name only, nothing else.\n\n"
            f"Vendor: {d.ven.iloc[i]}\nExpense description: {d.ext.iloc[i]}\n"
            f"Taxonomy: {d.l1.iloc[i]} / {d.l2.iloc[i]}\nAmount USD: {d.amt.iloc[i]:,.2f}"
        )
        try:
            resp = client.predict(endpoint=endpoint, inputs={
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.0, "max_tokens": 16})
            answer = resp["choices"][0]["message"]["content"].strip()
        except Exception as exc:
            print(f"[T7] call failed at row {i}: {type(exc).__name__}")
            continue
        if answer in LABELS:                       # hard constraint to the taxonomy
            scored.iloc[i, scored.columns.get_indexer(
                ["SERVICE_CATEGORY", "RULE_APPLIED", "CONFIDENCE", "SCORE"])] = \
                [answer, "T7 LLM adjudication", "Medium", 0.60]
            changed += 1

    print(f"[T7] adjudicated {changed:,} of {len(low):,} Low-confidence lines via {endpoint}")
    return scored

# COMMAND ----------

# MAGIC %md ## 7. Classifier — vectorized
# MAGIC
# MAGIC Each tier is one merge. Keyword regexes run against the *unique* vendor list —
# MAGIC roughly 1,400 strings instead of millions of rows — and the result is mapped back.
# MAGIC The fallback is only computed for lines that could still change: unresolved ones
# MAGIC plus the impure lookups eligible for override.

# COMMAND ----------


def _kw_map(vendors, patterns):
    vs = pd.Series(list(vendors), dtype=object)
    out = np.full(len(vs), None, dtype=object)
    for pat, cat in patterns:
        if not pat:
            continue
        hit = vs.str.contains(pat, regex=True, na=False).to_numpy()
        out[hit & (out == None)] = cat            # noqa: E711 — object-array null test
    return pd.Series(out, index=list(vendors))


def classify(df, RF, fb):
    d = prep(df).reset_index(drop=True)
    n = len(d)
    cat = np.full(n, None, dtype=object)
    rule = np.full(n, None, dtype=object)
    pur = np.full(n, np.nan, dtype=float)

    generic = d.ext.isin(RF["generic"]).to_numpy()
    uv = pd.unique(d.ven)
    kw_s = d.ven.map(_kw_map(uv, RF["strong"])).to_numpy()
    kw_w = d.ven.map(_kw_map(uv, RF["weak"])).to_numpy()

    def apply(m, keys, tier, allow=None, fixed_pur=None):
        if m is None or not len(m):
            return
        j = d[keys].merge(m, on=keys, how="left")
        jc = j["cat"].to_numpy()
        ok = pd.notna(jc) & (cat == None)          # noqa: E711
        if allow is not None:
            ok &= allow
        if not ok.any():
            return
        cat[ok] = jc[ok]
        rule[ok] = tier
        pur[ok] = fixed_pur if fixed_pur is not None else j["pur"].to_numpy()[ok]

    apply(RF["manual"], ["ven", "ext", "l2"], "T0 manual rule", fixed_pur=1.0)
    apply(RF["vel"], ["ven", "ext", "l2"], "T1 vendor+expense+taxonomy")
    apply(RF["ve"], ["ven", "ext"], "T2 vendor+expense")
    apply(RF["e"][RF["e"].pur >= HIGH_PURITY], ["ext"],
          "T3 specific expense description", allow=~generic)

    ok = pd.notna(kw_s) & (cat == None)            # noqa: E711
    cat[ok] = kw_s[ok]; rule[ok] = "T4 vendor keyword (strong)"; pur[ok] = 0.95

    apply(RF["v"][RF["v"].pur >= VENDOR_PURITY], ["ven"], "T5 vendor history",
          allow=(d.ven.to_numpy() != "UNKNOWN"))

    ok = pd.notna(kw_w) & (cat == None) & (~generic)   # noqa: E711
    cat[ok] = kw_w[ok]; rule[ok] = "T4 vendor keyword (weak)"; pur[ok] = 0.78

    overridable = (np.isin(rule, ["T2 vendor+expense", "T5 vendor history"]) |
                   ((rule == "T1 vendor+expense+taxonomy") & (pur < HIGH_PURITY)))
    need = (cat == None) | overridable             # noqa: E711
    fb_cat = np.full(n, None, dtype=object)
    fb_p = np.zeros(n)
    if need.any():
        c_, p_ = predict_fallback(d.loc[need], fb)
        fb_cat[need] = c_
        fb_p[need] = p_

    take = overridable & (fb_p >= MODEL_OVERRIDE)
    cat[take] = fb_cat[take]; rule[take] = "T6 fallback override"; pur[take] = fb_p[take]
    rest = (cat == None)                           # noqa: E711
    cat[rest] = fb_cat[rest]; rule[rest] = "T6 statistical fallback"; pur[rest] = fb_p[rest]

    high_tiers = ["T0 manual rule", "T3 specific expense description", "T4 vendor keyword (strong)"]
    conf = np.where(np.isin(rule, high_tiers), "High",
           np.where(rule == "T1 vendor+expense+taxonomy",
                    np.where(pur >= HIGH_PURITY, "High", "Medium"),
           np.where(rule == "T6 statistical fallback",
                    np.where(pur >= HIGH_PURITY, "High",
                             np.where(pur >= 0.70, "Medium", "Low")), "Medium")))

    out = pd.DataFrame({"SERVICE_CATEGORY": cat, "RULE_APPLIED": rule,
                        "CONFIDENCE": conf, "SCORE": np.round(pur, 3)}, index=df.index)
    return llm_adjudicate(out, d)

# COMMAND ----------

# MAGIC %md ## 8. History and rules

# COMMAND ----------

history = None

if RUN_MODE in ("mine_rules", "both"):
    if not table_exists(FQ(HISTORY_TBL)):
        if not BOOTSTRAP_TBL:
            raise ValueError(
                f"{FQ(HISTORY_TBL)} does not exist. Point bootstrap_table at the reviewed "
                "Jun/Jul export (the one with the Action column) to create it."
            )
        raw = read_pdf(FQ(BOOTSTRAP_TBL), required=FEATURES + ["SERVICE_CATEGORY"])
        write_delta(freeze_history(raw), FQ(HISTORY_TBL), partition="MONTH")

    history = read_pdf(FQ(HISTORY_TBL), required=FEATURES + ["SERVICE_CATEGORY"])
    gold = build_gold(history)

    manual = pd.DataFrame(columns=RULE_SCHEMA)
    if table_exists(FQ(RULES_TBL)):
        existing = read_pdf(FQ(RULES_TBL), required=RULE_SCHEMA)
        manual = existing[existing.SOURCE.astype(str).str.lower() == "manual"]
        print(f"[rules] preserving {len(manual)} manual rules")

    rules = mine_rules(history, gold)
    if len(manual):
        rules = pd.concat([manual, rules], ignore_index=True)
    write_delta(rules, FQ(RULES_TBL))
    print(rules.groupby(["TIER", "RULE_TYPE"]).size().to_string())

# COMMAND ----------

# MAGIC %md ## 9. Validate and calibrate
# MAGIC
# MAGIC **Walk-forward** is the headline once the history spans more than two months: fit
# MAGIC on everything up to month *k*, score month *k+1*, step forward, repeat. That is how
# MAGIC the notebook actually gets used, and it gives one figure per month instead of a
# MAGIC single number that hides drift.
# MAGIC
# MAGIC **Unseen vendor** — 5-fold grouped by vendor — answers the other question: what a
# MAGIC brand-new supplier looks like. The gap between the two is how much of the accuracy
# MAGIC comes from vendor memory rather than learned pattern.
# MAGIC
# MAGIC Per-tier accuracies are pooled across every fold and written to the tier-accuracy
# MAGIC table, then joined back at score time so an unlabeled month carries a defensible
# MAGIC estimate.

# COMMAND ----------

if RUN_MODE in ("mine_rules", "both"):
    from sklearn.model_selection import GroupKFold

    def eval_split(train_pdf, test_pdf):
        g_tr = build_gold(train_pdf)
        RF_tr = rules_to_frames(mine_rules(train_pdf, g_tr))
        fb_tr = fit_fallback(train_pdf, g_tr)
        pred = classify(test_pdf, RF_tr, fb_tr)
        ok = pred.SERVICE_CATEGORY.to_numpy() == build_gold(test_pdf).to_numpy()
        w = np.abs(pd.to_numeric(test_pdf.SPEND_USD, errors="coerce").fillna(0).to_numpy())
        return ok.mean(), (w[ok].sum() / w.sum() if w.sum() else np.nan), pred, ok

    metrics, walk_rows, preds, oks = {}, [], [], []
    months = sorted_months(history.MONTH)
    print(f"[validate] history months in order: {months}")

    if len(months) >= 2:
        for i in range(1, len(months)):
            train = history[history.MONTH.isin(months[:i])]
            test = history[history.MONTH == months[i]]
            line, spend, pred, ok = eval_split(train, test)
            walk_rows.append({"TRAIN_THROUGH": months[i - 1], "SCORED_MONTH": months[i],
                              "TRAIN_ROWS": len(train), "SCORED_ROWS": len(test),
                              "LINE_ACCURACY": round(float(line), 4),
                              "SPEND_ACCURACY": round(float(spend), 4)})
            preds.append(pred)
            oks.append(ok)
            print(f"[walk-forward] fit through {months[i-1]:>8} -> score {months[i]:>8}: "
                  f"line {line:.4f}  spend {spend:.4f}")

        walk = pd.DataFrame(walk_rows)
        metrics["walkforward_line_mean"] = float(walk.LINE_ACCURACY.mean())
        metrics["walkforward_line_last"] = float(walk.LINE_ACCURACY.iloc[-1])
        metrics["walkforward_spend_mean"] = float(walk.SPEND_ACCURACY.mean())
        if len(months) == 2:      # a reverse check is only meaningful with exactly two
            metrics["reverse_line"], metrics["reverse_spend"], _, _ = eval_split(
                history[history.MONTH == months[1]], history[history.MONTH == months[0]])
    else:
        walk = pd.DataFrame()
        print("[warn] fewer than two months in history — skipping the temporal tests")

    accs = [eval_split(history.iloc[tr], history.iloc[te])[0]
            for tr, te in GroupKFold(n_splits=5).split(history, groups=history.VENDOR_NORMALIZED)]
    metrics["unseen_vendor_line"] = float(np.mean(accs))

    print()
    for k, v in metrics.items():
        print(f"{k:24s} {v:.4f}")

    if preds:
        pv = pd.concat(preds, ignore_index=True)
        okv = np.concatenate(oks)
        tier_acc = (pd.DataFrame({"RULE_APPLIED": pv.RULE_APPLIED, "ok": okv})
                    .groupby("RULE_APPLIED").ok.agg(LINES="size", ACCURACY="mean").reset_index())
        conf_acc = (pd.DataFrame({"CONFIDENCE": pv.CONFIDENCE, "ok": okv})
                    .groupby("CONFIDENCE").ok.agg(LINES="size", ACCURACY="mean").reset_index())
        print()
        print(tier_acc.round(3).to_string(index=False))
        print(conf_acc.round(3).to_string(index=False))

        calib = pd.concat([
            tier_acc.assign(SCOPE="rule").rename(columns={"RULE_APPLIED": "KEY"}),
            conf_acc.assign(SCOPE="confidence").rename(columns={"CONFIDENCE": "KEY"}),
            pd.DataFrame([{"SCOPE": "overall", "KEY": k, "LINES": len(pv), "ACCURACY": v}
                          for k, v in metrics.items()]),
        ], ignore_index=True)
        calib["RUN_ID"] = RUN_ID
        calib["MEASURED_AT"] = pd.Timestamp.utcnow().tz_localize(None)
        write_delta(calib, FQ(ACC_TBL))
        if len(walk):
            walk["RUN_ID"] = RUN_ID
            write_delta(walk, f"{FQ(ACC_TBL)}_walkforward")

# COMMAND ----------

# MAGIC %md ## 10. Score — one month at a time
# MAGIC
# MAGIC The input may hold any number of months. They are processed in calendar order
# MAGIC (`JUN-26` before `JUL-26` before `JAN-27` — a string sort gets that wrong), and each
# MAGIC month gets its own output rows, review queue and summary, so a twelve-month
# MAGIC backfill produces twelve reviewable units rather than one undifferentiated blob.
# MAGIC
# MAGIC With `overwrite_month = true` a month's earlier rows are deleted before its new ones
# MAGIC land, so re-running a batch is safe and can't double-count.
# MAGIC
# MAGIC `sequential_learning` is off by default. Switched on, each month's High-confidence
# MAGIC lines join the working vendor memory before the next month is scored — worth it on
# MAGIC a long backfill where a vendor first appears mid-range. It also propagates
# MAGIC unreviewed machine labels forward, so errors can compound. Leave it off unless you
# MAGIC are backfilling and will review the whole range afterwards.

# COMMAND ----------

if RUN_MODE in ("score", "both"):
    if not INPUT_TBL:
        raise ValueError("input_table is required in score mode")

    sdf_in = check_columns(FQ(INPUT_TBL), FEATURES)
    total_rows = sdf_in.count()
    if total_rows == 0:
        raise ValueError(f"{FQ(INPUT_TBL)} is empty")

    has_month = "MONTH" in sdf_in.columns
    if has_month:
        month_list = sorted_months([r[0] for r in sdf_in.select("MONTH").distinct().collect()])
    elif RUN_MONTH:
        month_list = [RUN_MONTH]
    else:
        raise ValueError("input has no MONTH column — set the run_month widget")
    print(f"[score] {total_rows:,} rows across {len(month_list)} month(s): {month_list}")

    RF = rules_to_frames(read_pdf(FQ(RULES_TBL), required=RULE_SCHEMA))
    hist_fb = history if history is not None else read_pdf(
        FQ(HISTORY_TBL), required=FEATURES + ["SERVICE_CATEGORY"])
    fb = fit_fallback(hist_fb, build_gold(hist_fb))
    known_vendors = set(prep(hist_fb).ven.unique())

    def clear_month(fq_name, month_label):
        if OVERWRITE_MONTH and table_exists(fq_name):
            safe = str(month_label).replace("'", "''")
            spark.sql(f"DELETE FROM {fq_name} WHERE MONTH = '{safe}'")
            print(f"  [idempotent] cleared {month_label} from {fq_name}")

    all_scored = []
    for month_label in month_list:
        sdf_m = sdf_in.where(F.col("MONTH") == month_label) if has_month else sdf_in
        rows_m = sdf_m.count()
        if rows_m == 0:
            continue
        n_chunks = max(1, int(np.ceil(rows_m / CHUNK_ROWS)))
        print(f"\n[month {month_label}] {rows_m:,} rows in {n_chunks} chunk(s)")
        clear_month(FQ(OUTPUT_TBL), month_label)

        month_parts = []
        for c in range(n_chunks):
            if n_chunks == 1:
                pdf = sdf_m.toPandas()
            else:
                pdf = (sdf_m.withColumn("_b", F.abs(F.hash(F.col("VENDOR_NORMALIZED"))) % n_chunks)
                       .where(F.col("_b") == c).drop("_b").toPandas())
                if not len(pdf):
                    continue

            # an input re-read from a previous output would carry these; drop so the
            # concat below can't produce duplicate columns
            pdf = pdf.drop(columns=[c for c in OUTPUT_COLS if c in pdf.columns], errors="ignore")
            pred = classify(pdf, RF, fb)
            scored = pd.concat([pdf.reset_index(drop=True), pred.reset_index(drop=True)], axis=1)
            if "MONTH" not in scored.columns:
                scored.insert(0, "MONTH", month_label)
            scored["IS_NEW_VENDOR"] = ~prep(scored).ven.isin(known_vendors).to_numpy()
            scored["RUN_ID"] = RUN_ID
            scored["SCORED_AT"] = pd.Timestamp.utcnow().tz_localize(None)

            write_delta(scored, FQ(OUTPUT_TBL), mode="append", partition="MONTH")
            month_parts.append(scored)
            print(f"  chunk {c + 1}/{n_chunks}: {len(scored):,} rows")

        month_scored = pd.concat(month_parts, ignore_index=True)
        all_scored.append(month_scored)

        if SEQUENTIAL:
            confident = month_scored[month_scored.CONFIDENCE == "High"]
            if len(confident):
                add = freeze_history(confident, month=month_label)
                hist_fb = pd.concat([hist_fb, add], ignore_index=True)
                RF = rules_to_frames(mine_rules(hist_fb, build_gold(hist_fb)))
                known_vendors |= set(prep(add).ven.unique())
                print(f"  [sequential] folded {len(confident):,} High-confidence lines into "
                      "working memory for the next month")

    scored_all = pd.concat(all_scored, ignore_index=True)
    print(f"\n[score] {len(scored_all):,} rows written to {FQ(OUTPUT_TBL)}")

# COMMAND ----------

# MAGIC %md ## 11. Run summary — per month
# MAGIC
# MAGIC A scored month has no labels, so accuracy can't be measured on it directly. Each
# MAGIC line inherits the walk-forward accuracy of the tier that classified it, and those
# MAGIC are averaged into an estimate. New-vendor share sits beside it because that is what
# MAGIC moves the estimate — unseen vendors score around 85% against 99% for known ones.
# MAGIC
# MAGIC Reading the months side by side is the point. A tier mix or new-vendor share that
# MAGIC shifts sharply from one month to the next is a data problem, not a model one.

# COMMAND ----------

if RUN_MODE in ("score", "both"):
    tier_lookup = {}
    if table_exists(FQ(ACC_TBL)):
        ta = read_pdf(FQ(ACC_TBL), required=["SCOPE", "KEY", "ACCURACY"])
        tier_lookup = dict(zip(ta.loc[ta.SCOPE == "rule", "KEY"],
                               ta.loc[ta.SCOPE == "rule", "ACCURACY"]))
    if not tier_lookup:
        print("[warn] no tier-accuracy table — run mine_rules first for an accuracy estimate")

    def month_metrics(sm):
        exp = sm.RULE_APPLIED.map(tier_lookup)
        w = sm.SPEND_USD.abs()
        exp_line = float(exp.fillna(exp.mean()).mean()) if tier_lookup else np.nan
        exp_spend = (float((exp.fillna(exp.mean()) * w).sum() / w.sum())
                     if tier_lookup and w.sum() else np.nan)
        return {
            "MONTH": sm.MONTH.iloc[0],
            "ROWS": len(sm),
            "SPEND": float(sm.SPEND_USD.sum()),
            "VENDORS": int(sm.VENDOR_NORMALIZED.nunique()),
            "NEW_VENDOR_SHARE": round(float(sm.IS_NEW_VENDOR.mean()), 4),
            "HIGH_CONF_SHARE": round(float((sm.CONFIDENCE == "High").mean()), 4),
            "REVIEW_SHARE": round(float((sm.CONFIDENCE != "High").mean()), 4),
            "EXPECTED_ACC_LINE": round(exp_line, 4),
            "EXPECTED_ACC_SPEND": round(exp_spend, 4),
            "CREDIT_LINES": int((sm.SPEND_USD < 0).sum()),
            "UNKNOWN_LINES": int((sm.SERVICE_CATEGORY == "Unknown").sum()),
        }

    rows = [month_metrics(sm) for _, sm in scored_all.groupby("MONTH", sort=False)]
    summary = pd.DataFrame(rows).set_index("MONTH").reindex(
        [m for m in month_list if m in {r["MONTH"] for r in rows}]).reset_index()
    print(summary.to_string(index=False))

    cols = [m for m in month_list if m in set(scored_all.MONTH)]
    tier_mix = scored_all.pivot_table(index="RULE_APPLIED", columns="MONTH",
                                      values="SPEND_USD", aggfunc="size", fill_value=0)
    print("\nlines by tier and month:")
    print(tier_mix.reindex(columns=cols, fill_value=0).to_string())

    cat_mix = scored_all.pivot_table(index="SERVICE_CATEGORY", columns="MONTH",
                                     values="SPEND_USD", aggfunc="sum", fill_value=0.0)
    print("\nspend by category and month:")
    print(cat_mix.reindex(index=LABELS, columns=cols, fill_value=0.0).round(0).to_string())

    for _, row in summary.iterrows():
        if row.NEW_VENDOR_SHARE > 0.10:
            print(f"\n[warn] {row.MONTH}: {row.NEW_VENDOR_SHARE:.1%} of lines come from vendors "
                  "absent from the history. Unseen vendors score ~85% vs ~99% for known ones, "
                  "so the estimate above is optimistic. Check vendor normalization against the "
                  "history before assuming the supply base changed.")

    out_summary = summary.copy()
    out_summary["RUN_ID"] = RUN_ID
    out_summary["SUMMARISED_AT"] = pd.Timestamp.utcnow().tz_localize(None)
    for m in out_summary.MONTH:
        clear_month(FQ(SUMMARY_TBL), m)
    write_delta(out_summary, FQ(SUMMARY_TBL), mode="append")

# COMMAND ----------

# MAGIC %md ## 12. Review queue
# MAGIC
# MAGIC Medium and Low only. High runs near 99.8% while Medium and Low run near 50%, so
# MAGIC this is where review time actually pays. Grouped by month + vendor + expense +
# MAGIC taxonomy and sorted by absolute spend, so the largest exposure surfaces first.
# MAGIC `CORRECTED_CATEGORY` replaces the old `Action` column.
# MAGIC
# MAGIC Across a multi-month batch the same vendor/expense group usually recurs every
# MAGIC month. `RECURS_IN_MONTHS` counts how many, so a reviewer can fix one group once and
# MAGIC know it settles the whole range — sort by it to find the highest-leverage rows.

# COMMAND ----------

if RUN_MODE in ("score", "both"):
    queue = (scored_all[scored_all.CONFIDENCE.isin(["Medium", "Low"])]
             .groupby(["MONTH", "VENDOR_NORMALIZED", "EXTC_DESCRIPTION", "AID_TAXONOMY_LEVEL2",
                       "SERVICE_CATEGORY", "RULE_APPLIED", "CONFIDENCE"], dropna=False)
             .agg(LINES=("SPEND_USD", "size"), SPEND=("SPEND_USD", "sum"),
                  AVG_SCORE=("SCORE", "mean"), NEW_VENDOR=("IS_NEW_VENDOR", "max")).reset_index())
    keys3 = ["VENDOR_NORMALIZED", "EXTC_DESCRIPTION", "AID_TAXONOMY_LEVEL2"]
    recur = queue.groupby(keys3).MONTH.nunique().rename("RECURS_IN_MONTHS")
    queue = queue.merge(recur, on=keys3, how="left")
    queue = queue.reindex(queue.SPEND.abs().sort_values(ascending=False).index)
    queue["EXPECTED_ACCURACY"] = queue.RULE_APPLIED.map(tier_lookup)
    queue["CORRECTED_CATEGORY"] = ""
    queue["REVIEWED_BY"] = ""
    queue["RUN_ID"] = RUN_ID

    if len(queue):
        covered = int(queue.LINES.sum())
        print(f"{len(queue):,} groups / {covered:,} lines "
              f"({covered / len(scored_all):.1%} of the batch, "
              f"{queue.SPEND.abs().sum() / scored_all.SPEND_USD.abs().sum():.1%} of spend)")
        distinct = queue.drop_duplicates(keys3)
        print(f"{len(distinct):,} distinct vendor/expense groups once months are collapsed — "
              f"reviewing those settles all {len(queue):,} rows")
        print(queue.groupby("MONTH").agg(GROUPS=("LINES", "size"),
                                         LINES=("LINES", "sum")).to_string())
    for m in month_list:
        clear_month(FQ(QUEUE_TBL), m)
    write_delta(queue, FQ(QUEUE_TBL), mode="append", partition="MONTH")
    display(queue.head(50))

# COMMAND ----------

# MAGIC %md ## 13. Feedback loop
# MAGIC
# MAGIC Run **after** a reviewer fills `CORRECTED_CATEGORY`, then rerun in `mine_rules`
# MAGIC mode so the corrections become rules. Corrections apply at vendor + expense +
# MAGIC taxonomy level; a group needing a split across two categories has to be edited
# MAGIC line by line in the output table.
# MAGIC
# MAGIC `fold_months` takes the whole batch at once and folds them in calendar order.
# MAGIC Months already present in the history are skipped rather than duplicated.
# MAGIC
# MAGIC Left commented deliberately — calling it before review appends the classifier's
# MAGIC own guesses as ground truth and quietly degrades every month after.

# COMMAND ----------


def fold_month_into_history(month_label, run_id=None):
    sdf = spark.read.table(FQ(OUTPUT_TBL))
    sdf.limit(0).count()
    sdf = sdf.where(F.col("MONTH") == month_label)
    if run_id:
        sdf = sdf.where(F.col("RUN_ID") == run_id)
    sm = sdf.toPandas()
    if not len(sm):
        raise ValueError(f"no rows in {FQ(OUTPUT_TBL)} for MONTH = {month_label}")

    keys = ["VENDOR_NORMALIZED", "EXTC_DESCRIPTION", "AID_TAXONOMY_LEVEL2"]
    if table_exists(FQ(QUEUE_TBL)):
        q = spark.read.table(FQ(QUEUE_TBL)).where(F.col("MONTH") == month_label).toPandas()
        q = q[q.CORRECTED_CATEGORY.astype(str).str.strip() != ""]
        if len(q):
            fix = q.drop_duplicates(keys).set_index(keys)["CORRECTED_CATEGORY"]
            sm["CORRECTED_CATEGORY"] = fix.reindex(pd.MultiIndex.from_frame(sm[keys])).to_numpy()
            print(f"[feedback] applying {len(q)} corrections")
        else:
            print("[feedback] queue has no corrections filled in — folding as-is")

    write_delta(freeze_history(sm, month=month_label), FQ(HISTORY_TBL),
                mode="append", partition="MONTH")


def fold_months(month_labels=None, run_id=None):
    """Fold a whole batch into the history, in calendar order, skipping duplicates."""
    labels = sorted_months(month_labels if month_labels is not None else month_list)
    already = set()
    if table_exists(FQ(HISTORY_TBL)):
        already = {r[0] for r in spark.read.table(FQ(HISTORY_TBL))
                   .select("MONTH").distinct().collect()}
    for m in labels:
        if m in already:
            print(f"[feedback] {m} already in history — skipping")
            continue
        fold_month_into_history(m, run_id=run_id)


# fold_months(run_id=RUN_ID)

# COMMAND ----------

# MAGIC %md ## Notes
# MAGIC
# MAGIC - **Query the rules.** `SELECT * FROM svc_cat_rules WHERE CATEGORY = 'Legal Services'
# MAGIC   ORDER BY SUPPORT DESC` shows exactly what drives a category, with evidence counts.
# MAGIC - **Override by inserting, not editing code.** A row with `SOURCE = 'manual'` and
# MAGIC   `RULE_TYPE = 'vendor_extc_l2'` becomes T0 and survives every re-mine.
# MAGIC - **Vendor normalization must match the history exactly.** The tiers key on string
# MAGIC   equality, so a changed normalization rule silently drops vendors from the 99.5%
# MAGIC   tier into the 78% fallback. `IS_NEW_VENDOR` and `new_vendor_line_share` in the run
# MAGIC   summary are the tripwire — a sudden jump means normalization drifted, not that the
# MAGIC   supply base changed.
# MAGIC - `AID_TAXONOMY_LEVEL1` is constant (`Professional Services`) in Jun/Jul so it adds
# MAGIC   nothing today; it stays encoded so nothing breaks if future months differ.
# MAGIC - `AID_TAXONOMY_LEVEL2` is the largest single accuracy contributor — it resolves 96%
# MAGIC   of vendor/expense pairs that carry two different labels.
# MAGIC - Some reviewed labels conflict across months for the same vendor/expense/taxonomy
# MAGIC   (CSC outsourcing, PwC Advisory, Accenture fixed-bid). No classifier can be right
# MAGIC   about both; resolving them is worth more than further tuning.
