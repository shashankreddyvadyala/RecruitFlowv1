# Databricks notebook source
# MAGIC %md
# MAGIC # Spend classification — read → regex → LLM → rename → Excel
# MAGIC
# MAGIC Runs in five phases, in order:
# MAGIC
# MAGIC | Phase | What happens |
# MAGIC |---|---|
# MAGIC | **1** | Read the source table |
# MAGIC | **2** | Regex engine classifies everything it can, deterministically |
# MAGIC | **3** | LLM resolves only what the regex left as `Low` confidence |
# MAGIC | **4** | Internal labels renamed to your final category names |
# MAGIC | **5** | Reconcile, then write the `.xlsx` |
# MAGIC
# MAGIC Set the table name and the model name in the next cell. Nothing else is required.
# COMMAND ----------

# MAGIC %md
# MAGIC ## Setup
# MAGIC
# MAGIC `input_table` accepts `catalog.schema.table`, or a path to Delta / Parquet /
# MAGIC CSV / Excel if you'd rather point at a file.
# COMMAND ----------

dbutils.widgets.text("input_table",  "", "① Source table")
dbutils.widgets.text("model_name",   "databricks-meta-llama-3-3-70b-instruct", "② LLM endpoint")
dbutils.widgets.text("excel_dir",    "/Volumes/main/spend_analytics/exports", "③ Excel output dir")

dbutils.widgets.text("catalog",   "main",            "Catalog")
dbutils.widgets.text("schema",    "spend_analytics", "Schema")
dbutils.widgets.text("run_month", "",                "Run month YYYY-MM (blank = all)")
dbutils.widgets.dropdown("use_llm", "true", ["true", "false"], "Run the LLM phase")
dbutils.widgets.dropdown("llm_scope", "all_rows", ["all_rows", "low_confidence_only"],
                         "Which rows the LLM scores")
dbutils.widgets.dropdown("llm_authority", "low_and_medium",
                         ["low_and_medium", "low_only", "llm_wins"],
                         "Which rows the LLM may overrule")
dbutils.widgets.dropdown("conflict_policy", "precedence",
                         ["precedence", "description_wins", "vendor_wins"],
                         "When vendor and description disagree")
dbutils.widgets.dropdown("run_selftest", "true", ["true", "false"], "Self-tests before running")
dbutils.widgets.dropdown("apply_naming", "true", ["true", "false"],
                         "Rename categories and layers (Phase 4)")

INPUT     = dbutils.widgets.get("input_table").strip()
MODEL     = dbutils.widgets.get("model_name").strip()
EXCEL_DIR = dbutils.widgets.get("excel_dir").strip()
CATALOG   = dbutils.widgets.get("catalog").strip()
SCHEMA    = dbutils.widgets.get("schema").strip()
RUN_MONTH = dbutils.widgets.get("run_month").strip()
USE_LLM       = dbutils.widgets.get("use_llm") == "true"
LLM_SCOPE     = dbutils.widgets.get("llm_scope")
LLM_AUTHORITY = dbutils.widgets.get("llm_authority")
SELFTEST  = dbutils.widgets.get("run_selftest") == "true"
APPLY_NAMING = dbutils.widgets.get("apply_naming") == "true"
CONFLICT_POLICY = dbutils.widgets.get("conflict_policy")

assert INPUT, "Set ① input_table"
assert MODEL or not USE_LLM, "Set ② model_name, or set use_llm to false"

FQ = f"{CATALOG}.{SCHEMA}"
T_LABELS,  T_VENDOR  = f"{FQ}.cls_labels",     f"{FQ}.cls_vendor_rules"
T_DESC,    T_DESC_RX = f"{FQ}.cls_desc_exact", f"{FQ}.cls_desc_regex"
T_TAX,     T_TAX_RX  = f"{FQ}.cls_tax_exact",  f"{FQ}.cls_tax_regex"
T_NAMES              = f"{FQ}.cls_final_names"
T_LAYERS             = f"{FQ}.cls_layer_names"
T_STAGE,   T_CACHE   = f"{FQ}.cls_stage",      f"{FQ}.cls_llm_cache"
T_OUTPUT,  T_REVIEW  = f"{FQ}.cls_output",     f"{FQ}.cls_review_queue"

# Most workspace users do not hold CREATE CATALOG, and the statement can be refused
# even when the catalog already exists. Only attempt what is actually missing, and
# fail with a message that says which grant to ask for.
existing = {r[0] for r in spark.sql("SHOW CATALOGS").collect()}
if CATALOG not in existing:
    try:
        spark.sql(f"CREATE CATALOG IF NOT EXISTS {CATALOG}")
    except Exception as exc:
        raise PermissionError(
            f"Catalog '{CATALOG}' does not exist and could not be created. Either point "
            f"the catalog widget at one you can already write to, or ask for CREATE "
            f"CATALOG on the metastore. Underlying error: {exc}") from exc
try:
    spark.sql(f"CREATE SCHEMA IF NOT EXISTS {FQ}")
except Exception as exc:
    raise PermissionError(
        f"Cannot create schema '{FQ}'. You need CREATE SCHEMA on catalog '{CATALOG}', "
        f"or point the schema widget at an existing one. Underlying error: {exc}") from exc
spark.sql(f"USE {FQ}")
# Stricter than local Spark — left on so bad expressions fail loudly here rather
# than silently producing nulls in production.
spark.conf.set("spark.sql.ansi.enabled", "true")

from pyspark.sql import functions as F, Window
import re as _re, os

print(f"source : {INPUT}")
print(f"model  : {MODEL if USE_LLM else '(LLM phase off)'}")
if USE_LLM:
    print(f"         scores {LLM_SCOPE}, may overrule {LLM_AUTHORITY}")
print(f"excel  : {EXCEL_DIR}")
print(f"naming : {'on' if APPLY_NAMING else 'off — internal labels used as-is'}")
# COMMAND ----------

# MAGIC %md
# MAGIC ## Your category names — optional
# MAGIC
# MAGIC **Skip this and the next cell entirely if you are happy with the internal
# MAGIC labels.** Set `apply_naming` to `false` and Phase 4 passes everything straight
# MAGIC through: `final_category` becomes the internal label and `rule_layer` becomes
# MAGIC the raw layer code. Nothing downstream breaks — the columns still exist, they
# MAGIC just are not renamed.
# MAGIC
# MAGIC With `apply_naming` on, this is the only cell you need to edit to change how
# MAGIC categories appear in the output.
# MAGIC
# MAGIC The left side is the internal label the rules engine works with — leave those
# MAGIC alone, every rule references them. The right side is what appears in the Excel
# MAGIC file. Change the right side freely.
# MAGIC
# MAGIC It ships as an identity map, so out of the box nothing is renamed. Two
# MAGIC alternatives from your label workbook are included below, commented out —
# MAGIC uncomment one, or write your own.
# MAGIC
# MAGIC Two names may map to the same final name, which merges those categories in the
# MAGIC report. A name missing from this map falls back to the internal label.
# COMMAND ----------

FINAL_NAMES = {
    "LEGAL SERVICES":        "LEGAL SERVICES",
    "IT Services":           "IT Services",
    "Management Consulting": "Management Consulting",
    "Other Consulting":      "Other Consulting",
    "Financial Consulting":  "Financial Consulting",
    "HR Consulting":         "HR Consulting",
    "Marketing Consulting":  "Marketing Consulting",
    "Lobbying":              "Lobbying",
    "ACCOUNTING SERVICES":   "ACCOUNTING SERVICES",
    "Audit Services":        "Audit Services",
    "Taxation Services":     "Taxation Services",
    "not in scope":          "not in scope",
    "OTHERS":                "OTHERS",
}
FINAL_PARENT_NAME = "FINANCIAL SERVICES"

# ---- Alternative A — consistent title case (the shipped labels mix ALL CAPS,
#      Title Case and lower case, which reads badly in a report):
# FINAL_NAMES = {k: k.title() if k.isupper() else k.capitalize() if k.islower() else k
#                for k in FINAL_NAMES}
# FINAL_PARENT_NAME = "Financial Services"

# ---- Alternative B — the "from_presentation" names in distinct_labels_1.xlsx.
#      Note this set has no equivalent for OTHERS or 'not in scope', and it adds
#      "Information Services", which no rule currently targets:
# FINAL_NAMES = {
#     "LEGAL SERVICES":        "Legal Services",
#     "IT Services":           "IT Consulting & Application Development/Management",
#     "Management Consulting": "Management Consulting",
#     "Other Consulting":      "Other Consulting",
#     "Financial Consulting":  "Financial Consulting",
#     "HR Consulting":         "HR Consulting",
#     "Marketing Consulting":  "Marketing Consulting",
#     "Lobbying":              "Lobbyists Services",
#     "ACCOUNTING SERVICES":   "Accounting Services",
#     "Audit Services":        "Audit Services",
#     "Taxation Services":     "Taxation Services",
#     "not in scope":          "Not In Scope",
#     "OTHERS":                "Others",
# }

if APPLY_NAMING:
    (spark.createDataFrame(list(FINAL_NAMES.items()), "internal_label STRING, final_name STRING")
     .write.mode("overwrite").option("overwriteSchema", "true").saveAsTable(T_NAMES))
    changed = sum(1 for k, v in FINAL_NAMES.items() if k != v)
    print(f"{len(FINAL_NAMES)} names -> {T_NAMES}  ({changed} actually renamed)")
else:
    print("apply_naming=false — category names left as the internal labels.")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Your rules engine layer names — optional
# MAGIC
# MAGIC Also governed by `apply_naming`. With it off, `rule_layer` carries the raw code
# MAGIC (`T2a description exact`) instead of the readable name.
# MAGIC
# MAGIC `RULE_METHOD` below is **not** optional and always applies. It is provenance,
# MAGIC not cosmetics — whether a line was decided by rules, by the model, or not at
# MAGIC all is a fact about the run, and the reconciliation and Excel both rely on it.
# MAGIC
# MAGIC The engine records *which layer decided each line* — `T2a description exact`,
# MAGIC `T3b taxonomy regex`, and so on. Useful to you, meaningless to whoever opens
# MAGIC the workbook.
# MAGIC
# MAGIC This maps each internal layer code to a readable name, exactly like
# MAGIC `FINAL_NAMES` does for categories. Left side is internal — every tier in
# MAGIC `classify_df` emits one of these, so leave them alone. Right side is what
# MAGIC appears in the output. Edit freely.
# MAGIC
# MAGIC `RULE_METHOD` is the coarser cut: was this decided by the deterministic rules,
# MAGIC by the model, or not at all. That is the split most people actually want to
# MAGIC see — "how much of this did a machine guess at".

# COMMAND ----------

RULE_LAYER_NAMES = {
    "T1 vendor regex":                        "Supplier name",
    "T2a description exact":                  "Expense description (exact)",
    "T2b description regex":                  "Expense description (pattern)",
    "T1+T2 conflict -> precedence":           "Supplier vs description (precedence)",
    "T1+T2 conflict -> description_wins":     "Supplier vs description (description wins)",
    "T1+T2 conflict -> vendor_wins":          "Supplier vs description (supplier wins)",
    "T3a taxonomy exact":                     "Accounting taxonomy (exact)",
    "T3b taxonomy regex":                     "Accounting taxonomy (pattern)",
    "T4 unresolved":                          "Unresolved",
    "LLM residual":                           "AI assisted",
}

RULE_METHOD = {
    "T1 vendor regex":                        "Rules engine",
    "T2a description exact":                  "Rules engine",
    "T2b description regex":                  "Rules engine",
    "T1+T2 conflict -> precedence":           "Rules engine",
    "T1+T2 conflict -> description_wins":     "Rules engine",
    "T1+T2 conflict -> vendor_wins":          "Rules engine",
    "T3a taxonomy exact":                     "Rules engine",
    "T3b taxonomy regex":                     "Rules engine",
    "T4 unresolved":                          "Unresolved",
    "LLM residual":                           "AI assisted",
}

assert set(RULE_LAYER_NAMES) == set(RULE_METHOD), \
    "RULE_LAYER_NAMES and RULE_METHOD must cover the same layer codes"

# rule_layer is cosmetic and honours apply_naming; classification_method always applies.
(spark.createDataFrame(
     [(k, v if APPLY_NAMING else k, RULE_METHOD[k]) for k, v in RULE_LAYER_NAMES.items()],
     "rule_applied STRING, rule_layer STRING, classification_method STRING")
 .write.mode("overwrite").option("overwriteSchema", "true").saveAsTable(T_LAYERS))
print(f"{len(RULE_LAYER_NAMES)} layers -> {T_LAYERS}"
      f"  (layer names {'applied' if APPLY_NAMING else 'passthrough'}; method always applied)")
# COMMAND ----------

# MAGIC %md
# MAGIC # Phase 1 · Read the table
# MAGIC
# MAGIC Column names drift between extracts, so each role is matched against known
# MAGIC candidates and then a regex fallback. Only `vendor` is required.
# COMMAND ----------

def load_any(src: str):
    """Table name, or path to delta / parquet / csv / xlsx. Returns a DataFrame."""
    if "/" not in src and src.count(".") <= 2:
        print(f"reading as table: {src}")
        return spark.table(src)

    low = src.lower()
    if low.endswith((".csv", ".txt", ".tsv")):
        sep = "\t" if low.endswith(".tsv") else ","
        print(f"reading as CSV (sep={sep!r})")
        return (spark.read
                .option("header", "true").option("inferSchema", "true").option("sep", sep)
                .option("quote", '"').option("escape", '"')     # NOT the default backslash
                .option("multiLine", "true").option("mode", "PERMISSIVE")
                .csv(src))
    if low.endswith((".parquet", ".pq")):
        print("reading as Parquet")
        return spark.read.parquet(src)
    if low.endswith((".xlsx", ".xls")):
        print("reading as Excel via pandas")
        import pandas as pd
        local = src.replace("dbfs:/", "/dbfs/") if src.startswith("dbfs:/") else src
        pdf = pd.read_excel(local)
        pdf.columns = [str(c).strip() for c in pdf.columns]
        for c in pdf.columns:                    # object -> str, avoids Arrow type errors
            if pdf[c].dtype == "object":
                pdf[c] = pdf[c].astype(str).replace({"nan": None, "NaT": None})
        return spark.createDataFrame(pdf)
    print("reading as Delta")
    return spark.read.format("delta").load(src)


raw = load_any(INPUT)
print(f"\ncolumns ({len(raw.columns)}): {raw.columns}")
# COMMAND ----------

COLUMN_CANDIDATES = {
    "vendor":      ["ORGANIZATION_NAME", "SUPPLIER_NAME", "SUPPLIER_PARENT", "VENDOR_NAME",
                    "SUPPLIER_NORMALIZED", "VENDOR", "PAYEE"],
    "description": ["EXTC_DESCRIPTION", "EXPENSE_DESCRIPTION", "LINE_DESCRIPTION",
                    "INVOICE_LINE_DESCRIPTION", "EXPENSE_TYPE", "ITEM_DESCRIPTION"],
    "taxonomy":    ["AID_TAXONOMY_LEVEL2", "TAXONOMY_LEVEL2_NAME", "CATEGORY_L2",
                    "SPEND_CATEGORY"],
    "amount":      ["INVOICE_DIST_AMOUNT", "SPEND_IN_USD", "LINE_AMOUNT",
                    "INVOICE_LINE_AMOUNT", "AMOUNT", "SPEND"],
    "invoice_id":  ["INVOICE_NUM", "INVOICE_NUMBER", "INVOICE_ID", "PO_NUMBER", "DOC_NUMBER"],
    "date":        ["INVOICE_CREATION_DATE", "INVOICE_ACCOUNTING_DATE", "ACCOUNTING_DATE",
                    "INVOICE_DATE", "POSTING_DATE"],
}
ROLE_FALLBACK_RX = {
    "vendor":      r"(SUPPLIER|VENDOR|ORGANI[SZ]ATION|PAYEE).*NAME|^(SUPPLIER|VENDOR)$",
    "description": r"(EXPENSE|LINE|ITEM|EXTC).*DESC|DESC.*(EXPENSE|LINE)",
    "taxonomy":    r"TAXONOMY.*(2|L2)|CATEGORY.*(2|L2)",
    "amount":      r"(AMOUNT|SPEND|USD|VALUE)",
    "invoice_id":  r"(INVOICE|PO|DOC).*(NUM|ID)",
    "date":        r"DATE",
}


def resolve(role, cols):
    lookup = {c.upper().replace(" ", "_"): c for c in cols}
    for cand in COLUMN_CANDIDATES[role]:                      # exact, case-insensitive
        if cand.upper().replace(" ", "_") in lookup:
            return lookup[cand.upper().replace(" ", "_")]
    rx = _re.compile(ROLE_FALLBACK_RX[role])                  # regex fallback
    for norm, orig in lookup.items():
        if rx.search(norm):
            return orig
    return None


COLS = {r: resolve(r, raw.columns) for r in COLUMN_CANDIDATES}
for r, c in COLS.items():
    print(f"  {r:<12} -> {c or '(not found)'}")

assert COLS["vendor"], (
    "No vendor column found. Rename a column or add yours to "
    f"COLUMN_CANDIDATES['vendor']. Saw: {raw.columns}")
if not COLS["description"]:
    print("\n  WARNING: no description column — the regex phase loses its strongest "
          "signal and far more rows will reach the LLM.")
# COMMAND ----------

# MAGIC %md
# MAGIC # Phase 2 · Regex engine
# MAGIC
# MAGIC Everything deterministic happens here. Nothing is matched row by row — each
# MAGIC column is collapsed to its distinct values, those few hundred strings are
# MAGIC matched against the rule tables once, and the small result is broadcast back.
# MAGIC
# MAGIC | Tier | Signal | Match |
# MAGIC |---|---|---|
# MAGIC | 1 | Supplier name | regex, ordered, first match wins |
# MAGIC | 2a | Expense description | exact lookup |
# MAGIC | 2b | Expense description | regex, catches unseen wording |
# MAGIC | 3 | Accounting taxonomy | exact, then regex |
# MAGIC | 4 | Nothing matched | `OTHERS` |
# MAGIC
# MAGIC Anything that only reaches tier 3 or 4 is marked **Low** — that is precisely
# MAGIC what Phase 3 hands to the LLM.
# COMMAND ----------

LABELS = [
    ("OTHERS",                  0,  True,  None),
    ("ACCOUNTING SERVICES",     1,  True,  "FINANCIAL SERVICES"),
    ("Audit Services",          2,  True,  "FINANCIAL SERVICES"),
    ("Financial Consulting",    3,  True,  None),
    ("HR Consulting",           4,  True,  None),
    ("Marketing Consulting",    5,  True,  None),
    ("IT Services",             6,  True,  None),
    ("Management Consulting",   7,  True,  None),
    ("Taxation Services",       8,  True,  "FINANCIAL SERVICES"),
    ("not in scope",            9,  True,  None),
    ("Other Consulting",       10,  True,  None),
    ("Lobbying",               11,  True,  None),
    ("LEGAL SERVICES",         12,  True,  None),
    ("FINANCIAL SERVICES",     -1,  False, None),   # parent / rollup only
]
ASSIGNABLE = [l for l, _, a, _ in LABELS if a]
RANK       = {l: r for l, r, a, _ in LABELS if a}

(spark.createDataFrame(
     LABELS, "label STRING, precedence_rank INT, is_assignable BOOLEAN, parent_label STRING")
 .write.mode("overwrite").option("overwriteSchema", "true").saveAsTable(T_LABELS))
print(f"{len(ASSIGNABLE)} assignable labels · {FINAL_PARENT_NAME} is parent-only")
# COMMAND ----------

# MAGIC %md
# MAGIC ### Rule tables
# MAGIC
# MAGIC **Order is the design.** `DELOITTE & TOUCHE LLP` contains `LLP`, so Audit is
# MAGIC tested before Legal. `PWC US TAX LLP` is a tax practice, so Taxation is tested
# MAGIC before Audit. Lower `priority` = tested first.
# MAGIC
# MAGIC These are Delta tables. To change a rule permanently, `MERGE` the table and
# MAGIC re-run from Phase 2 — this cell overwrites them, so edits made downstream of
# MAGIC here are lost if you re-run from the top.
# COMMAND ----------

VENDOR_RULES = [
    (10,  "Taxation Services",     r"\bTAX\b|TAX\s+LLP|TAXATION"),
    (20,  "Audit Services",        r"DELOITTE|ERNST\s*(&|AND)\s*YOUNG|\bKPMG\b|PRICEWATERHOUSE|\bPWC\b|\bBDO\b|GRANT\s+THORNTON|MAZARS|RSM\s+US"),
    (30,  "Lobbying",              r"LOBBY|CAPITOL\s+COUNSEL|GOVERNMENT\s+(AFFAIRS|RELATIONS)|PUBLIC\s+AFFAIRS|POLICY\s+GROUP|LEGISLATIVE"),
    (40,  "Management Consulting", r"MCKINSEY|\bBAIN\b|BOSTON\s+CONSULTING|\bBCG\b|OLIVER\s+WYMAN|BOOZ|KEARNEY|ROLAND\s+BERGER|STRATEG"),
    (50,  "LEGAL SERVICES",        r"\bLAW\b|\bLLP\b|\bPLLC\b|\bPLC\b|\bLPA\b|ATTORNEY|LEGAL|COUNSEL|\bESQ\b|BARRISTER|SOLICITOR|COURT\s+REPORT|DEPOSITION|LEXITAS|REPORTING\s+BUREAU"),
    (60,  "ACCOUNTING SERVICES",   r"ACCOUNTING|BOOKKEEP|PAYROLL\s+SERVICES"),
    (70,  "Marketing Consulting",  r"MARKETING|ADVERTIS|\bMEDIA\b|BRANDING|PUBLIC\s+RELATIONS|OGILVY|NIELSEN|\bWPP\b|OMNICOM"),
    (80,  "HR Consulting",         r"\bHR\b|HUMAN\s+RESOURCE|RECRUIT|TALENT|MERCER|AON\s+HEWITT|WILLIS\s+TOWERS|KORN\s+FERRY|STAFFING"),
    (90,  "IT Services",           r"AMDOCS|INFOSYS|WIPRO|COGNIZANT|TECH\s+MAHINDRA|\bHCL\b|TATA\s+CONSULT|\bTCS\b|CAPGEMINI|ACCENTURE|\bIBM\b|CISCO|ERICSSON|NOKIA|MICROSOFT|ORACLE|\bSAP\b|\bDXC\b|COMPUTER\s+SCIENCES|\bCGI\b|MPHASIS|PERSISTENT|LTIMINDTREE|ICONECTIV|EQUINIX|RINGCENTRAL|QUALTRICS|SOFTWARE|TECHNOLOG|INFOTECH|CYBER|NETWORK|DIGITAL|COMPUTING|\bDATA\b|SYSTEMS|SOLUTIONS|\bIT\b"),
    (100, "Other Consulting",      r"CONSULT|ADVISOR"),
]

DESC_SPECIFIC = {
    "Legal Services & Fees": "LEGAL SERVICES",
    "Audit Services & Fees": "Audit Services",
    "Financial & Accounting Services": "ACCOUNTING SERVICES",
    "Consulting - Lobbying Consultants": "Lobbying",
    "Consulting - Acquisition/Strategic": "Management Consulting",
    "Adv-Other/Consulting Services": "Marketing Consulting",
    "Brand Marketing / Community Sponsorships": "Marketing Consulting",
    "Consulting - Database and Research Subscriptions": "Other Consulting",
    "Research & Development": "Other Consulting",
    "Outsourcing – Third Parties/Agents": "Other Consulting",
    "Banking Fees": "OTHERS",
    "Board of Directors Fees": "OTHERS",
    "Training": "HR Consulting",
    "Tuition Aid": "HR Consulting",
    "Contract Programmers & Data Processing-Fixed Bid Contractors": "IT Services",
    "Contract Programmers & Data Processing - Time & Material Contractors": "IT Services",
    "Contract Programmers & Data Processing": "IT Services",
    "Contract Labor - External Capitalized Labor - Fixed Bid Contract Programmers": "IT Services",
    "Contract Labor - External Capitalized Labor - Time and Material": "IT Services",
    "Data Proc - Programming Services": "IT Services",
    "Client Related Network Management": "IT Services",
    "Data Equipment Maintenance - Third Party": "IT Services",
    "Computer Maintenance & Repair": "IT Services",
    "Software - Optional Maintenance-PC": "IT Services",
    "Software-Optional-Maintenance Midrange": "IT Services",
    "Software Exp-Midrange": "IT Services",
    "Software RTU Fees-Expensed": "IT Services",
    "Software RTU Fees-Capitalized": "IT Services",
    "RTU - Software Modification": "IT Services",
    "Software as a Service, Hosted, ASP Services": "IT Services",
    "Co-Location": "IT Services",
    "Time Share Charges": "IT Services",
    "Other Professional & Consulting - Support Engineering": "IT Services",
    "Contract Equipment Engineering": "IT Services",
    "Contract Engineering & Drafting (Excl Installation)": "IT Services",
    "Other COGS- Equipment": "not in scope",
    "Other COGS- Other": "not in scope",
    "Material Purchases": "not in scope",
    "Data Processing Supplies": "not in scope",
    "Mobile Phone Expense": "not in scope",
    "Station, Forms & Office Supplies (Excl Cust Bills & Toll Stmts)": "not in scope",
    "Contract Delivery & Shipping - Other Than Initial Purchase": "not in scope",
    "Client Related Cost Adjustments": "not in scope",
    "Client Related Installations": "not in scope",
    "Contract Installation Labor": "not in scope",
    "Repair & Maintenance-Telephone Plant Shop Repair": "not in scope",
    "Repair & Maint.-Other": "not in scope",
    "State & Local Government-Fees, Licenses and Permits": "not in scope",
    "Other Licenses, Permits and Fees": "not in scope",
    "Third Party Reseller - Wireless": "not in scope",
    "Resale Arrangements": "not in scope",
    "Operating/Direct Revenues-Billed": "not in scope",
    "Retail Operating Revenues-Calendarization Accruals & Adjustments": "not in scope",
    "External - Official Communications Service Charges": "not in scope",
    "Internal - Official Communications Service Charges": "not in scope",
    "AT&T Corp": "not in scope",
    "E911 COGS- Direct Labor": "not in scope",
    "Managed Service COGS Direct Labor": "not in scope",
    "Other NonComputer Rentals & Leases": "not in scope",
    "Record Retention (Inactive Records Storage)": "not in scope",
    "Other Business & Conference Expense": "not in scope",
}

DESC_REGEX = [
    (10,  "Lobbying",              r"LOBBY"),
    (20,  "Audit Services",        r"\bAUDIT\b"),
    (30,  "Taxation Services",     r"\bTAX\b|TAXATION"),
    (40,  "LEGAL SERVICES",        r"\bLEGAL\b|ATTORNEY|LITIGATION|PARALEGAL|\bCOUNSEL\b"),
    (50,  "ACCOUNTING SERVICES",   r"ACCOUNTING|BOOKKEEP"),
    (60,  "not in scope",          r"\bCOGS\b|MATERIAL\s+PURCHASE|SUPPLIES|SHIPPING|INSTALLATION|REPAIR\s*&|LICENSES?\s+AND\s+PERMITS|PERMITS\s+AND\s+FEES|RESELLER|RESALE|REVENUES?-|RENTALS?\s*&\s*LEASE|RECORD\s+RETENTION|CONFERENCE\s+EXPENSE|MOBILE\s+PHONE|TUITION"),
    (70,  "Marketing Consulting",  r"ADVERTIS|\bADV-|MARKETING|SPONSORSHIP|PROMOTION|BRAND"),
    (80,  "HR Consulting",         r"TRAINING|RECRUIT|PAYROLL"),
    (90,  "Management Consulting", r"ACQUISITION|STRATEGIC"),
    (100, "IT Services",           r"SOFTWARE|PROGRAMMER|PROGRAMMING|DATA\s+PROC|COMPUTER|NETWORK\s+MANAGEMENT|HOSTED|\bASP\b|SAAS|CO-?LOCATION|\bRTU\b|MIDRANGE|DATA\s+EQUIPMENT|SUPPORT\s+ENGINEERING|EQUIPMENT\s+ENGINEERING|ENGINEERING\s*&\s*DRAFTING|TIME\s+SHARE"),
    (110, "Other Consulting",      r"CONSULT|RESEARCH|OUTSOURC|SUBSCRIPTION"),
]

DESC_GENERIC_RX = (
    r"^(CONTRACT SVCS/PROF FEES"
    r"|OTHER PROFESSIONAL SERVICES$"
    r"|TEMPORARY LABOR$"
    r"|CONTRACT LABOR \("
    r"|CONTRACT LABOR - CONTRACT SERVICE"
    r"|OTHER COGS- CONTRACT LABOR$"
    r"|OTHER BUSINESS COSTS$"
    r"|CORPORATE ENTRY)"
)

TAXONOMY_MAP = {
    "IT Services": "IT Services",
    "Network Professional Services": "IT Services",
    "Non-Payroll Worker (Staff Supplemental)": "IT Services",
    "Legal Services": "LEGAL SERVICES",
    "Consulting Services": "Other Consulting",
    "External & Legislative Affairs": "Lobbying",
    "Training & Education": "HR Consulting",
    "AT&T Business Services": "not in scope",
}

TAXONOMY_REGEX = [
    (10, "LEGAL SERVICES",   r"\bLEGAL\b"),
    (20, "Lobbying",         r"LEGISLATIV|LOBBY|POLITICAL"),
    (30, "HR Consulting",    r"TRAINING|EDUCATION|HUMAN\s+RESOURCE"),
    (40, "IT Services",      r"\bIT\b|NETWORK|TECHNOLOG|SOFTWARE|STAFF\s+SUPPLEMENTAL|NON-PAYROLL"),
    (50, "Other Consulting", r"CONSULT|PROFESSIONAL"),
]

(spark.createDataFrame(VENDOR_RULES, "priority INT, label STRING, pattern STRING")
 .write.mode("overwrite").option("overwriteSchema", "true").saveAsTable(T_VENDOR))
(spark.createDataFrame(list(DESC_SPECIFIC.items()), "description STRING, label STRING")
 .write.mode("overwrite").option("overwriteSchema", "true").saveAsTable(T_DESC))
(spark.createDataFrame(DESC_REGEX, "priority INT, label STRING, pattern STRING")
 .write.mode("overwrite").option("overwriteSchema", "true").saveAsTable(T_DESC_RX))
(spark.createDataFrame(list(TAXONOMY_MAP.items()), "taxonomy STRING, label STRING")
 .write.mode("overwrite").option("overwriteSchema", "true").saveAsTable(T_TAX))
(spark.createDataFrame(TAXONOMY_REGEX, "priority INT, label STRING, pattern STRING")
 .write.mode("overwrite").option("overwriteSchema", "true").saveAsTable(T_TAX_RX))

print(f"{len(VENDOR_RULES)} vendor · {len(DESC_SPECIFIC)} desc-exact · {len(DESC_REGEX)} "
      f"desc-regex · {len(TAXONOMY_MAP)} tax-exact · {len(TAXONOMY_REGEX)} tax-regex")
# COMMAND ----------

def normalise(df, cols):
    """Raw DataFrame -> the canonical columns every downstream cell expects."""
    g = lambda role, default: (F.col(cols[role]).cast("string") if cols.get(role)
                               else F.lit(default))
    amt  = F.col(cols["amount"]).cast("double") if cols.get("amount") else F.lit(0.0)
    date = F.col(cols["date"]).cast("date")     if cols.get("date")   else F.lit(None).cast("date")

    return (df
        .withColumn("vendor_raw", F.coalesce(g("vendor", "UNKNOWN"), F.lit("UNKNOWN")))
        # keep everything before the first '>', drop punctuation, squeeze whitespace
        .withColumn("vendor_norm", F.upper(F.trim(F.regexp_replace(
            F.regexp_replace(F.regexp_extract(F.col("vendor_raw"), r"^([^>]*)", 1), r"[.,]", " "),
            r"\s+", " "))))
        .withColumn("desc_norm", F.trim(F.coalesce(g("description", ""), F.lit(""))))
        .withColumn("desc_key",  F.upper(F.trim(F.regexp_replace(F.col("desc_norm"), r"\s+", " "))))
        .withColumn("tax_norm",  F.trim(F.coalesce(g("taxonomy", ""), F.lit(""))))
        .withColumn("tax_key",   F.upper(F.trim(F.regexp_replace(F.col("tax_norm"), r"\s+", " "))))
        .withColumn("amount",     F.coalesce(amt, F.lit(0.0)))
        .withColumn("invoice_id", F.coalesce(g("invoice_id", ""), F.lit("")))
        .withColumn("txn_date",   date)
        .withColumn("run_month",  F.coalesce(F.date_format(date, "yyyy-MM"), F.lit("unknown")))
        # (invoice, line) is NOT a unique grain in the real feed -> surrogate key
        .withColumn("line_uid", F.sha2(F.concat_ws("||",
            F.col("invoice_id"), F.col("vendor_raw"), F.col("desc_norm"),
            F.col("amount").cast("string"),
            F.coalesce(F.col("txn_date").cast("string"), F.lit("")),
            F.monotonically_increasing_id().cast("string")), 256))
        .withColumn("is_generic", F.col("desc_key").rlike(DESC_GENERIC_RX)))
# COMMAND ----------

def classify_df(df):
    """Apply every rule tier to a normalised DataFrame. Pure: no writes, no globals
    beyond the rule tables — which is what makes the self-tests in the last cell
    exercise the same code path production uses."""

    def regex_map(d, value_col, rule_table, out_col):
        """distinct values x ordered regex rules -> lowest-priority match per value."""
        rules = spark.table(rule_table)
        return (d.select(value_col).distinct()
                .join(F.broadcast(rules), F.expr(f"{value_col} RLIKE pattern"), "left")
                .withColumn("_rn", F.row_number().over(
                    Window.partitionBy(value_col).orderBy(F.col("priority").asc_nulls_last())))
                .where("_rn = 1")
                .select(value_col, F.col("label").alias(out_col)))

    vendor_map  = regex_map(df, "vendor_norm", T_VENDOR, "t1_label")
    desc_rx_map = regex_map(df.where(~F.col("is_generic")), "desc_key", T_DESC_RX, "t2b_label")
    tax_rx_map  = regex_map(df, "tax_key", T_TAX_RX, "t3b_label")

    desc_exact = (spark.table(T_DESC).select(
        F.upper(F.trim(F.regexp_replace(F.col("description"), r"\s+", " "))).alias("desc_key"),
        F.col("label").alias("t2a_label")).dropDuplicates(["desc_key"]))
    tax_exact = (spark.table(T_TAX).select(
        F.upper(F.trim(F.regexp_replace(F.col("taxonomy"), r"\s+", " "))).alias("tax_key"),
        F.col("label").alias("t3a_label")).dropDuplicates(["tax_key"]))

    rank_map = F.create_map([x for k, v in RANK.items() for x in (F.lit(k), F.lit(v))])

    e = (df
         .join(F.broadcast(vendor_map),  "vendor_norm", "left")
         .join(F.broadcast(desc_exact),  "desc_key",    "left")
         .join(F.broadcast(desc_rx_map), "desc_key",    "left")
         .join(F.broadcast(tax_exact),   "tax_key",     "left")
         .join(F.broadcast(tax_rx_map),  "tax_key",     "left")
         # generic descriptions may never resolve on their own, by either route
         .withColumn("t2a_label", F.when(F.col("is_generic"), F.lit(None)).otherwise(F.col("t2a_label")))
         .withColumn("t2b_label", F.when(F.col("is_generic"), F.lit(None)).otherwise(F.col("t2b_label")))
         .withColumn("t2_label",  F.coalesce("t2a_label", "t2b_label"))
         .withColumn("t2_src",    F.when(F.col("t2a_label").isNotNull(), F.lit("exact"))
                                   .when(F.col("t2b_label").isNotNull(), F.lit("regex")))
         .withColumn("t3_label",  F.coalesce("t3a_label", "t3b_label")))

    conflict = (F.col("t2_label").isNotNull() & F.col("t1_label").isNotNull()
                & (F.col("t1_label") != F.col("t2_label")))

    if CONFLICT_POLICY == "description_wins":
        winner = F.col("t2_label")
    elif CONFLICT_POLICY == "vendor_wins":
        winner = F.col("t1_label")
    else:
        winner = F.when(rank_map[F.col("t1_label")] > rank_map[F.col("t2_label")],
                        F.col("t1_label")).otherwise(F.col("t2_label"))

    return (e
        .withColumn("service_category", F.when(conflict, winner)
            .when(F.col("t2_label").isNotNull(), F.col("t2_label"))
            .when(F.col("t1_label").isNotNull(), F.col("t1_label"))
            .when(F.col("t3_label").isNotNull(), F.col("t3_label"))
            .otherwise(F.lit(None)))
        .withColumn("rule_applied", F.when(conflict, F.lit(f"T1+T2 conflict -> {CONFLICT_POLICY}"))
            .when(F.col("t2_src") == F.lit("exact"), F.lit("T2a description exact"))
            .when(F.col("t2_src") == F.lit("regex"), F.lit("T2b description regex"))
            .when(F.col("t1_label").isNotNull(),  F.lit("T1 vendor regex"))
            .when(F.col("t3a_label").isNotNull(), F.lit("T3a taxonomy exact"))
            .when(F.col("t3b_label").isNotNull(), F.lit("T3b taxonomy regex"))
            .otherwise(F.lit("T4 unresolved")))
        .withColumn("confidence", F.when(conflict, F.lit("Medium"))
            .when(F.col("t2_label").isNotNull(), F.lit("High"))
            # vendor matched but the description is a generic bucket -> weaker evidence
            .when(F.col("t1_label").isNotNull() & F.col("is_generic"), F.lit("Medium"))
            .when(F.col("t1_label").isNotNull(), F.lit("High"))
            .otherwise(F.lit("Low")))
        .withColumn("service_category", F.coalesce(F.col("service_category"), F.lit("OTHERS"))))
# COMMAND ----------

# MAGIC %md
# MAGIC ### Run the regex engine
# COMMAND ----------

base = normalise(raw, COLS)
if RUN_MONTH:
    base = base.where(F.col("run_month") == RUN_MONTH)

base.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable(T_STAGE)
base = spark.table(T_STAGE)      # materialise; cache() is unsupported on serverless

# Eager count at the boundary. A hardcoded month once defaulted to an empty period
# and masked every downstream bug — never trust a silent "success".
SRC_ROWS  = base.count()
SRC_SPEND = base.agg(F.sum("amount")).collect()[0][0] or 0.0
assert SRC_ROWS > 0, f"No rows after load/filter (run_month={RUN_MONTH or 'all'})."
print(f"rows  : {SRC_ROWS:,}")
print(f"spend : ${SRC_SPEND:,.2f}")

resolved = classify_df(base)
display(resolved.groupBy("rule_applied", "confidence").count().orderBy(F.desc("count")))
# COMMAND ----------

# MAGIC %md
# MAGIC # Phase 3 · LLM
# MAGIC
# MAGIC **Scoring and authority are separate decisions.** Scoring a row costs a call;
# MAGIC letting the model overrule the rules changes your numbers. They are two widgets.
# MAGIC
# MAGIC `llm_scope` — which rows the model looks at:
# MAGIC - `all_rows` (default) — every row. On Jun/Jul that is 52,897 rows deduplicated
# MAGIC   to **2,138 triples**. Scoring rows the rules already settled is not waste: it
# MAGIC   gives you an independent second opinion on the regex engine, reported below.
# MAGIC - `low_confidence_only` — just the residual, **531 triples**.
# MAGIC
# MAGIC `llm_authority` — which rows the model may actually change:
# MAGIC - `low_and_medium` (default) — the model decides everything the rules were not
# MAGIC   confident about. High-confidence rules stand.
# MAGIC - `low_only` — the model fills gaps only.
# MAGIC - `llm_wins` — the model overrules everywhere it returned a valid label,
# MAGIC   including direct description matches. Check the agreement report before
# MAGIC   choosing this.
# MAGIC
# MAGIC Either way `llm_category` is stored on every scored row, so disagreements stay
# MAGIC visible even when the model was not allowed to act on them.
# MAGIC
# MAGIC Deduplication to distinct (vendor, description, taxonomy) triples is what makes
# MAGIC `all_rows` affordable — 24.7x fewer calls than rows. Verdicts are cached in
# MAGIC Delta, so a re-run costs nothing for triples already seen.
# MAGIC
# MAGIC The model may only answer with a whitelisted label. A hallucination, a refusal,
# MAGIC an empty string, or the parent name is discarded and the regex verdict stands.
# COMMAND ----------

spark.sql(f"""CREATE TABLE IF NOT EXISTS {T_CACHE} (
    vendor_norm STRING, desc_key STRING, tax_key STRING,
    llm_label STRING, llm_raw STRING, model STRING, resolved_at TIMESTAMP) USING DELTA""")

scored_rows = (resolved if LLM_SCOPE == "all_rows"
               else resolved.where(F.col("confidence") == F.lit("Low")))
N_SCORED  = scored_rows.count()
residual  = scored_rows.select("vendor_norm", "desc_key", "tax_key").distinct()
N_TRIPLES = residual.count()
print(f"scope                 : {LLM_SCOPE}")
print(f"rows in scope         : {N_SCORED:,}")
print(f"distinct triples      : {N_TRIPLES:,}  ({N_SCORED / max(N_TRIPLES, 1):.1f}x dedup saving)")
print(f"regex left unresolved : {resolved.where(F.col('confidence') == F.lit('Low')).count():,} rows")

if USE_LLM and N_TRIPLES > 0:
    todo = residual.join(
        spark.table(T_CACHE).select("vendor_norm", "desc_key", "tax_key"),
        ["vendor_norm", "desc_key", "tax_key"], "left_anti")
    N_TODO = todo.count()
    print(f"uncached -> calls     : {N_TODO:,}")

    if N_TODO > 0:
        PROMPT = (
            "You classify corporate accounts-payable invoice lines into exactly one "
            "professional-services category.\n\nAllowed categories (reply with one, "
            "copied character for character):\n" + "\n".join(ASSIGNABLE) + "\n\nRules:\n"
            "- Reply with ONLY the category name. No punctuation, quotes or explanation.\n"
            "- 'FINANCIAL SERVICES' is a parent category and is NOT a valid answer.\n"
            "- The supplier's legal name is weak evidence. A company with 'Financial "
            "Services' in its name may well be selling IT contracting.\n"
            "- Staff augmentation and contract programmers are 'IT Services'.\n"
            "- Goods, revenue entries, permits and intercompany charges are 'not in scope'.\n"
            "- If the evidence genuinely supports no category, reply 'OTHERS'."
        )
        todo.createOrReplaceTempView("_llm_todo")
        spark.sql(f"""
            CREATE OR REPLACE TEMP VIEW _llm_scored AS
            SELECT vendor_norm, desc_key, tax_key,
                   ai_query('{MODEL}', CONCAT({repr(PROMPT)}, '\\n\\n',
                       'Supplier: ',            vendor_norm, '\\n',
                       'Expense description: ', desc_key,    '\\n',
                       'Accounting taxonomy: ', tax_key,     '\\n\\nCategory:')) AS llm_raw
            FROM _llm_todo""")

        scored = (spark.table("_llm_scored")
            # strip quotes, bullets and trailing punctuation the model may wrap it in
            .withColumn("cand", F.trim(F.regexp_replace(
                F.col("llm_raw"), r'^[\s"\'`*\-]+|[\s"\'`*\.\n\r]+$', "")))
            .withColumn("llm_label",
                F.when(F.col("cand").isin(ASSIGNABLE), F.col("cand")).otherwise(F.lit(None)))
            .withColumn("model", F.lit(MODEL))
            .withColumn("resolved_at", F.current_timestamp())
            .select("vendor_norm", "desc_key", "tax_key", "llm_label", "llm_raw",
                    "model", "resolved_at"))
        scored.write.mode("append").saveAsTable(T_CACHE)

        rejected = scored.where("llm_label IS NULL").count()
        print(f"scored {N_TODO:,} · whitelist rejections {rejected:,} "
              f"({rejected / max(N_TODO, 1):.1%})")
        if rejected:
            print("sample rejected output (tighten the prompt if this is high):")
            display(scored.where("llm_label IS NULL").select("llm_raw").distinct().limit(10))
else:
    print("LLM phase skipped — regex verdicts stand.")
# COMMAND ----------

# MAGIC %md
# MAGIC ### Merge the LLM verdicts back
# MAGIC
# MAGIC The pre-LLM answer is preserved in `rule_category`, so every override the model
# MAGIC made is auditable against what the rules alone would have said.
# COMMAND ----------

cache = (spark.table(T_CACHE).where("llm_label IS NOT NULL")
         .select("vendor_norm", "desc_key", "tax_key",
                 F.col("llm_label").alias("llm_category"))
         .dropDuplicates(["vendor_norm", "desc_key", "tax_key"]))

# Which rows the model is ALLOWED to change. Scoring is not authority.
if LLM_AUTHORITY == "llm_wins":
    may_override = F.lit(True)
elif LLM_AUTHORITY == "low_only":
    may_override = F.col("confidence") == F.lit("Low")
else:                                    # low_and_medium
    may_override = F.col("confidence").isin("Low", "Medium")

classified = (resolved
    .join(cache, ["vendor_norm", "desc_key", "tax_key"], "left")
    .withColumn("rule_category", F.col("service_category"))
    # llm_category is retained on EVERY scored row, even where the model had no
    # authority to act — that is what makes the agreement report below possible.
    .withColumn("llm_agrees", F.when(F.col("llm_category").isNull(), F.lit(None))
                               .otherwise(F.col("llm_category") == F.col("rule_category")))
    .withColumn("_applied", F.col("llm_category").isNotNull() & may_override
                            & (F.col("llm_category") != F.col("rule_category")))
    .withColumn("service_category",
        F.when(F.col("_applied"), F.col("llm_category")).otherwise(F.col("service_category")))
    .withColumn("rule_applied",
        F.when(F.col("_applied"), F.lit("LLM residual")).otherwise(F.col("rule_applied")))
    .withColumn("confidence",
        F.when(F.col("_applied"), F.lit("Medium")).otherwise(F.col("confidence")))
    .drop("_applied"))

n_llm = classified.where("rule_applied = 'LLM residual'").count()
print(f"authority         : {LLM_AUTHORITY}")
print(f"final verdict from rules : {SRC_ROWS - n_llm:,}")
print(f"final verdict from LLM   : {n_llm:,}")

# COMMAND ----------

# MAGIC %md
# MAGIC ### Rules vs model — agreement report
# MAGIC
# MAGIC With `llm_scope = all_rows` you get an independent second opinion on the regex
# MAGIC engine for free. This is the payoff for scoring rows the rules already settled.
# MAGIC
# MAGIC Read it this way: **disagreement on High-confidence rows is the interesting
# MAGIC signal.** Those are rows a deterministic rule matched directly. If the model
# MAGIC disagrees often there, either a rule is wrong or the prompt is. Either way it is
# MAGIC worth looking at before trusting `llm_wins`.

# COMMAND ----------

scored = classified.where(F.col("llm_category").isNotNull())
n_scored = scored.count()

if n_scored == 0:
    print("No LLM verdicts to compare — run Phase 3 with use_llm=true.")
else:
    print(f"rows with an LLM verdict : {n_scored:,} of {SRC_ROWS:,}")
    agree = scored.where("llm_agrees").count()
    print(f"agreement with rules     : {agree:,} / {n_scored:,} ({agree / n_scored:.1%})")
    print()
    display(scored.groupBy("confidence")
            .agg(F.count("*").alias("rows"),
                 F.sum(F.when(F.col("llm_agrees"), 1).otherwise(0)).alias("agree"),
                 F.round(F.avg(F.when(F.col("llm_agrees"), 1.0).otherwise(0.0)), 4).alias("agree_rate"))
            .orderBy("confidence"))

    # Where they disagree, ranked by spend — this is the review list that matters
    disagree = (scored.where("NOT llm_agrees")
        .groupBy("rule_category", "llm_category", "rule_applied", "confidence")
        .agg(F.count("*").alias("lines"), F.round(F.sum("amount"), 2).alias("spend"))
        .orderBy(F.desc("lines")))
    print(f"\ndistinct disagreement patterns: {disagree.count():,}")
    display(disagree.limit(30))
# COMMAND ----------

# MAGIC %md
# MAGIC # Phase 4 · Apply your names — optional
# MAGIC
# MAGIC **With `apply_naming = false` this phase is a passthrough.** It still runs and
# MAGIC still produces `final_category`, `final_parent` and `rule_layer`, because
# MAGIC everything downstream expects those columns — but they carry the internal
# MAGIC labels unchanged. No rename table is read.
# MAGIC
# MAGIC With it on, `service_category` still keeps the internal label so rules and the
# MAGIC review queue stay consistent, and `final_category` carries the renamed version
# MAGIC that the Excel reports on.
# MAGIC
# MAGIC `final_parent` is not cosmetic either way: it is what makes the three children
# MAGIC roll up under the parent, so it is always computed.
# COMMAND ----------

labels = spark.table(T_LABELS).select(
    F.col("label").alias("service_category"), "parent_label")

if APPLY_NAMING:
    named = (classified
        .join(F.broadcast(spark.table(T_NAMES)
                          .withColumnRenamed("internal_label", "service_category")),
              "service_category", "left")
        # a label missing from FINAL_NAMES falls back to itself rather than going null
        .withColumn("final_category", F.coalesce("final_name", "service_category"))
        .drop("final_name"))
else:
    named = classified.withColumn("final_category", F.col("service_category"))

final = (named
    .join(F.broadcast(labels), "service_category", "left")
    # the parent rollup is structural, not cosmetic — always applied. Only the
    # parent's display name follows apply_naming.
    .withColumn("final_parent",
        F.when(F.col("parent_label").isNotNull(),
               F.lit(FINAL_PARENT_NAME if APPLY_NAMING else "FINANCIAL SERVICES"))
         .otherwise(F.col("final_category")))
    .join(F.broadcast(spark.table(T_LAYERS)), "rule_applied", "left")
    # an unmapped layer code falls back to itself rather than going null
    .withColumn("rule_layer", F.coalesce("rule_layer", "rule_applied"))
    .withColumn("classification_method", F.coalesce("classification_method", F.lit("Rules engine")))
    .withColumn("classified_at", F.current_timestamp())
    .drop("parent_label", "t2a_label", "t2b_label",
          "t3a_label", "t3b_label", "t2_src"))
# llm_category and llm_agrees survive to the output table on purpose: an override
# you cannot inspect after the fact is an override you cannot defend.

(final.write.mode("overwrite").option("overwriteSchema", "true")
      .partitionBy("run_month").saveAsTable(T_OUTPUT))
print(f"written -> {T_OUTPUT}")
display(final.groupBy("final_parent", "final_category")
             .agg(F.count("*").alias("lines"), F.round(F.sum("amount"), 2).alias("spend"))
             .orderBy(F.desc("spend")))
display(final.groupBy("classification_method", "rule_layer")
             .agg(F.count("*").alias("lines"), F.round(F.sum("amount"), 2).alias("spend"))
             .orderBy(F.desc("lines")))
# COMMAND ----------

# MAGIC %md
# MAGIC # Phase 5 · Reconcile, then write the Excel file
# MAGIC
# MAGIC Hard gates first. A pipeline that reports success without checking that totals
# MAGIC tie has told you nothing — these raise rather than exporting a wrong workbook.
# COMMAND ----------

out         = spark.table(T_OUTPUT)
out_rows    = out.count()
out_spend   = out.agg(F.sum("amount")).collect()[0][0] or 0.0
n_bad       = out.where(~F.col("service_category").isin(ASSIGNABLE)).count()
n_parent    = out.where(F.col("service_category") == F.lit("FINANCIAL SERVICES")).count()
n_null      = out.where(F.col("final_category").isNull()).count()
n_uid       = out.select("line_uid").distinct().count()

checks = [
    ("row count ties to source", out_rows == SRC_ROWS,              f"{out_rows:,} vs {SRC_ROWS:,}"),
    ("spend ties to source",     abs(out_spend - SRC_SPEND) < 0.01, f"${out_spend:,.2f} vs ${SRC_SPEND:,.2f}"),
    ("all labels whitelisted",   n_bad == 0,                        f"{n_bad:,} violations"),
    ("parent never assigned",    n_parent == 0,                     f"{n_parent:,} rows"),
    ("every row has a name",     n_null == 0,                       f"{n_null:,} nulls"),
    ("line_uid is unique",       n_uid == out_rows,                 f"{n_uid:,} of {out_rows:,}"),
]
for name, ok, detail in checks:
    print(f"[{'PASS' if ok else 'FAIL'}] {name:<26} {detail}")
failed = [n for n, ok, _ in checks if not ok]
if failed:
    raise AssertionError(f"Reconciliation failed, not exporting: {failed}")
print("\nAll checks passed.")
# COMMAND ----------

# MAGIC %md
# MAGIC ### Review queue
# MAGIC
# MAGIC Everything below High confidence, ranked by spend so review effort goes where
# MAGIC the money is. Corrections written into `corrected_category` are the seed for
# MAGIC new regex rules — the deterministic engine should grow each month and the LLM
# MAGIC residual should shrink.
# COMMAND ----------

review = (spark.table(T_OUTPUT).where("confidence <> 'High'")
    .groupBy("run_month", "vendor_norm", "desc_norm", "tax_norm",
             "rule_category", "final_category", "classification_method", "rule_layer",
             "confidence")
    .agg(F.count("*").alias("lines"), F.round(F.sum("amount"), 2).alias("spend"))
    .withColumn("corrected_category", F.lit(None).cast("string"))
    .orderBy(F.desc("spend")))

(review.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable(T_REVIEW))
print(f"review queue: {review.count():,} groups -> {T_REVIEW}")
# COMMAND ----------

# MAGIC %md
# MAGIC ### Write the workbook
# MAGIC
# MAGIC Four sheets. The Summary uses live `COUNTIF` / `SUMIF` formulas against the
# MAGIC data sheet, so if someone edits a category by hand the totals reflow.
# MAGIC
# MAGIC If `openpyxl` is missing, run `%pip install openpyxl` in a cell of its own —
# MAGIC Databricks magics have to be the first line of a cell — then re-run this one.
# COMMAND ----------

EXCEL_ROW_CAP = 200_000
assert out_rows <= EXCEL_ROW_CAP, (
    f"{out_rows:,} rows exceeds the {EXCEL_ROW_CAP:,} Excel cap — set run_month and re-run.")

try:
    from openpyxl import Workbook
except ImportError as exc:
    raise ImportError("openpyxl missing — run `%pip install openpyxl` in its own cell.") from exc
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

KEEP = ["run_month", "vendor_norm", "desc_norm", "tax_norm", "amount", "invoice_id",
        "final_parent", "final_category", "classification_method", "rule_layer",
        "service_category", "rule_category", "llm_category", "llm_agrees",
        "rule_applied", "confidence"]
pdf = spark.table(T_OUTPUT).select(*KEEP).toPandas()
rq  = spark.table(T_REVIEW).toPandas()

FINAL_ORDER = sorted({FINAL_NAMES.get(l, l) for l in ASSIGNABLE})
HDR = Font(name="Arial", bold=True, color="FFFFFF")
FILL = PatternFill("solid", fgColor="305496")

wb = Workbook()
ws = wb.active
ws.title = "Summary"

dat = wb.create_sheet("Classified Lines")
dat.append(KEEP)
for row in pdf.itertuples(index=False):
    dat.append(list(row))
LAST = len(pdf) + 1
CAT, AMT, CONF = "H", "E", "P"          # final_category / amount / confidence
METH, LAYER    = "I", "J"               # classification_method / rule_layer

ws["A1"] = "Invoice classification"
ws["A1"].font = Font(name="Arial", size=14, bold=True)
ws["A2"] = f"{out_rows:,} lines · {INPUT} · conflict_policy={CONFLICT_POLICY}"
ws["A2"].font = Font(name="Arial", size=9, italic=True)

for j, h in enumerate(["Category", "Lines", "Spend", "% of spend"], start=1):
    c = ws.cell(row=4, column=j, value=h)
    c.font, c.fill = HDR, FILL
    c.alignment = Alignment(horizontal="center")

r = 5
for lab in FINAL_ORDER:
    ws.cell(row=r, column=1, value=lab)
    ws.cell(row=r, column=2, value=f"=COUNTIF('Classified Lines'!${CAT}$2:${CAT}${LAST},$A{r})")
    ws.cell(row=r, column=3, value=f"=SUMIF('Classified Lines'!${CAT}$2:${CAT}${LAST},$A{r},'Classified Lines'!${AMT}$2:${AMT}${LAST})")
    ws.cell(row=r, column=4, value=f"=IFERROR(C{r}/$C${5 + len(FINAL_ORDER)},0)")
    ws.cell(row=r, column=2).number_format = "#,##0"
    ws.cell(row=r, column=3).number_format = "$#,##0;($#,##0);-"
    ws.cell(row=r, column=4).number_format = "0.0%"
    r += 1

for j, col in zip(range(2, 5), "BCD"):
    ws.cell(row=r, column=j, value=f"=SUM({col}5:{col}{r-1})")
    ws.cell(row=r, column=j).font = Font(name="Arial", bold=True)
    ws.cell(row=r, column=j).fill = PatternFill("solid", fgColor="D9E1F2")
ws.cell(row=r, column=1, value="TOTAL").font = Font(name="Arial", bold=True)
ws.cell(row=r, column=1).fill = PatternFill("solid", fgColor="D9E1F2")
ws.cell(row=r, column=2).number_format = "#,##0"
ws.cell(row=r, column=3).number_format = "$#,##0;($#,##0);-"
ws.cell(row=r, column=4).number_format = "0.0%"

cf = r + 2
for i, h in enumerate(["Confidence", "Lines"], start=1):
    c = ws.cell(row=cf, column=i, value=h)
    c.font, c.fill = HDR, FILL
for i, lvl in enumerate(["High", "Medium", "Low"]):
    rr = cf + 1 + i
    ws.cell(row=rr, column=1, value=lvl)
    ws.cell(row=rr, column=2, value=f"=COUNTIF('Classified Lines'!${CONF}$2:${CONF}${LAST},$A{rr})")
    ws.cell(row=rr, column=2).number_format = "#,##0"

# How each line was decided — rules engine vs model, then the layer breakdown
mr = cf + 6
for i, h in enumerate(["How it was decided", "Lines", "Spend"], start=1):
    c = ws.cell(row=mr, column=i, value=h)
    c.font, c.fill = HDR, FILL
METHODS = sorted(set(RULE_METHOD.values()))
for i, meth in enumerate(METHODS):
    rr = mr + 1 + i
    ws.cell(row=rr, column=1, value=meth).font = Font(name="Arial", bold=True)
    ws.cell(row=rr, column=2, value=f"=COUNTIF('Classified Lines'!${METH}$2:${METH}${LAST},$A{rr})")
    ws.cell(row=rr, column=3, value=f"=SUMIF('Classified Lines'!${METH}$2:${METH}${LAST},$A{rr},'Classified Lines'!${AMT}$2:${AMT}${LAST})")
    ws.cell(row=rr, column=2).number_format = "#,##0"
    ws.cell(row=rr, column=3).number_format = "$#,##0;($#,##0);-"

lr = mr + len(METHODS) + 3
for i, h in enumerate(["Rules engine layer", "Lines", "Spend"], start=1):
    c = ws.cell(row=lr, column=i, value=h)
    c.font, c.fill = HDR, FILL
for i, layer in enumerate(sorted(set(RULE_LAYER_NAMES.values()))):
    rr = lr + 1 + i
    ws.cell(row=rr, column=1, value=layer)
    ws.cell(row=rr, column=2, value=f"=COUNTIF('Classified Lines'!${LAYER}$2:${LAYER}${LAST},$A{rr})")
    ws.cell(row=rr, column=3, value=f"=SUMIF('Classified Lines'!${LAYER}$2:${LAYER}${LAST},$A{rr},'Classified Lines'!${AMT}$2:${AMT}${LAST})")
    ws.cell(row=rr, column=2).number_format = "#,##0"
    ws.cell(row=rr, column=3).number_format = "$#,##0;($#,##0);-"

# Rules vs model agreement — only meaningful when the LLM scored the rows
ar = lr + len(set(RULE_LAYER_NAMES.values())) + 3
n_scored_x = int(pdf.llm_category.notna().sum())
for i, h in enumerate(["Rules vs model", "Lines", "Spend"], start=1):
    c = ws.cell(row=ar, column=i, value=h)
    c.font, c.fill = HDR, FILL
if n_scored_x:
    n_agree_x = int((pdf.llm_agrees == True).sum())
    for i, (lab, val, spd) in enumerate([
        ("Scored by model", n_scored_x, float(pdf.loc[pdf.llm_category.notna(), "amount"].sum())),
        ("Agree with rules", n_agree_x, float(pdf.loc[pdf.llm_agrees == True, "amount"].sum())),
        ("Disagree",         n_scored_x - n_agree_x,
         float(pdf.loc[(pdf.llm_category.notna()) & (pdf.llm_agrees != True), "amount"].sum())),
    ]):
        rr = ar + 1 + i
        ws.cell(row=rr, column=1, value=lab)
        ws.cell(row=rr, column=2, value=val).number_format = "#,##0"
        ws.cell(row=rr, column=3, value=round(spd, 2)).number_format = "$#,##0;($#,##0);-"
    ws.cell(row=ar + 4, column=1,
            value=f"Agreement rate: {n_agree_x / n_scored_x:.1%}  ·  scope={LLM_SCOPE}, authority={LLM_AUTHORITY}")
    ws.cell(row=ar + 4, column=1).font = Font(name="Arial", size=9, italic=True)
else:
    ws.cell(row=ar + 1, column=1, value="LLM phase not run — no comparison available.")
    ws.cell(row=ar + 1, column=1).font = Font(name="Arial", size=9, italic=True)

rv = wb.create_sheet("Review Queue")
rv.append(list(rq.columns))
for row in rq.itertuples(index=False):
    rv.append(list(row))

nt = wb.create_sheet("Notes")
nt.append(["Note"])
for line in [
    f"Source: {INPUT}. Rows: {out_rows:,}. Spend: ${out_spend:,.2f}. Reconciled against source before export.",
    f"{FINAL_PARENT_NAME} is a PARENT and is never assigned to a line. It rolls up "
    "ACCOUNTING SERVICES + Audit Services + Taxation Services.",
    "Signal order: supplier-name regex, then description (exact then regex), then accounting "
    "taxonomy. Taxonomy is a last resort — it is demonstrably mis-tagged in places.",
    "Generic accounting-bucket descriptions (Corporate Entry - Other, Temporary Labor, "
    "Other Professional Services) never resolve on their own. They defer to vendor, then "
    "taxonomy, then the LLM.",
    f"conflict_policy={CONFLICT_POLICY}. When supplier and description disagree, this decides. "
    "On Jun/Jul data it affects 2,291 lines and $126.6M — worth running both ways to compare.",
    "Confidence: High = supplier or description matched directly. Medium = tiers disagreed and "
    "policy decided, or the LLM resolved it. Low = taxonomy fallback only.",
    "service_category is the internal label; final_category is the renamed output. "
    "rule_category preserves the pre-LLM verdict, so every LLM override is auditable.",
    f"apply_naming={APPLY_NAMING}. When false, final_category and rule_layer carry the "
    "internal labels unchanged; classification_method and the parent rollup always apply.",
    f"llm_scope={LLM_SCOPE}, llm_authority={LLM_AUTHORITY}. Scope is which rows the model "
    "scored; authority is which rows it was allowed to change. llm_category holds the "
    "model's answer on every scored row even where it had no authority, and llm_agrees "
    "flags whether it matched the rules — so disagreements stay visible either way.",
    "classification_method says whether a line was decided by the deterministic rules "
    "engine or by the model. rule_layer says which specific layer decided it. Both are "
    "editable via RULE_LAYER_NAMES and RULE_METHOD in the notebook.",
    "Review Queue holds everything below High confidence, ranked by spend. Corrections there "
    "are the seed for new regex rules.",
]:
    nt.append([line])
nt.column_dimensions["A"].width = 150
for row in nt.iter_rows(min_row=2):
    row[0].alignment = Alignment(wrap_text=True, vertical="top")

for sh in (ws, dat, rv, nt):
    for c in sh[1]:
        if c.value:
            c.font, c.fill = HDR, FILL
for sh in (dat, rv):
    sh.freeze_panes = "A2"
    for i in range(1, sh.max_column + 1):
        sh.column_dimensions[get_column_letter(i)].width = 26
for col, w in zip("ABCD", [42, 12, 18, 13]):
    ws.column_dimensions[col].width = w

os.makedirs(EXCEL_DIR, exist_ok=True)
DEST = os.path.join(EXCEL_DIR, f"spend_classification_{RUN_MONTH or 'all'}.xlsx")
wb.save(DEST)
print(f"exported {out_rows:,} rows -> {DEST}")
# COMMAND ----------

# MAGIC %md
# MAGIC ---
# MAGIC # Appendix · Self-tests
# MAGIC
# MAGIC These call `classify_df` — the same function Phase 2 uses — against fixtures
# MAGIC built in memory. They guard the behaviours that broke during development and
# MAGIC would break silently if a rule were edited carelessly.
# MAGIC
# MAGIC The generic-guard case matters most: `Contract Labor (Excl Installation)`
# MAGIC contains the word INSTALLATION, which the `not in scope` regex matches. Without
# MAGIC the guard, thousands of staff-augmentation lines get misfiled with no error.
# COMMAND ----------

if SELFTEST:
    CASES = [
        ("PWC US TAX LLP",             "",                                       "",
         "Taxation Services",  "tax tested before audit, audit before the LLP legal rule"),
        ("DELOITTE & TOUCHE LLP",      "",                                       "",
         "Audit Services",     "audit tested before the LLP legal rule"),
        ("SMITH & JONES LLP",          "",                                       "",
         "LEGAL SERVICES",     "LLP with no earlier match"),
        ("WIRELESS POLICY GROUP LLC",  "",                                       "",
         "Lobbying",           "policy group beats the IT reading of WIRELESS"),
        ("MAHINDRA & MAHINDRA FINANCIAL SERVICES LIMITED", "Corporate Entry - Other",
         "Consulting Services",
         "Other Consulting",   "no Financial Services rule; generic desc defers to taxonomy"),
        ("ACME LAW FIRM LLP",          "Contract Programmers & Data Processing", "",
         {"precedence": "LEGAL SERVICES", "description_wins": "IT Services",
          "vendor_wins": "LEGAL SERVICES"}[CONFLICT_POLICY],
         f"vendor/description conflict, policy={CONFLICT_POLICY}"),
        ("UNKNOWN VENDOR XYZ",         "Legal Services & Fees - International",   "",
         "LEGAL SERVICES",     "T2b regex catches wording absent from the exact map"),
        ("UNKNOWN VENDOR XYZ",         "Withholding Tax Advisory",                "",
         "Taxation Services",  "T2b regex"),
        ("GENERIC HOLDINGS",           "Contract Labor (Excl Installation)", "IT Services",
         "IT Services",        "GENERIC GUARD: must not be pulled to 'not in scope' by INSTALLATION"),
        ("GENERIC HOLDINGS",           "Zzz Totally Unmapped Charge",             "",
         "OTHERS",             "nothing matches -> unresolved, goes to the LLM"),
    ]
    fx = spark.createDataFrame(
        [(v, d, t) for v, d, t, _, _ in CASES],
        "ORGANIZATION_NAME STRING, EXTC_DESCRIPTION STRING, AID_TAXONOMY_LEVEL2 STRING")
    got = (classify_df(normalise(fx, {"vendor":      "ORGANIZATION_NAME",
                                      "description": "EXTC_DESCRIPTION",
                                      "taxonomy":    "AID_TAXONOMY_LEVEL2"}))
           .select("vendor_norm", "desc_norm", "service_category").toPandas())

    fails = []
    for (v, d, t, exp, why), (_, r) in zip(CASES, got.iterrows()):
        ok = r.service_category == exp
        if not ok:
            fails.append((d or v, exp, r.service_category))
        print(f"[{'PASS' if ok else 'FAIL'}] {(d or v)[:44]:<44} -> {r.service_category:<21} ({why})")

    inv = [
        ("at least one assignable label",     len(ASSIGNABLE) >= 1),
        ("label names are unique",            len(ASSIGNABLE) == len(set(ASSIGNABLE))),
        ("precedence ranks are unique",       len(RANK.values()) == len(set(RANK.values()))),
        ("parent not assignable",             "FINANCIAL SERVICES" not in ASSIGNABLE),
        ("every parent_label is a real label",
         all(p in dict((l, r) for l, r, _, _ in LABELS) for _, _, _, p in LABELS if p)),
        ("no Financial Services vendor rule",
         not any(l == "Financial Services" for _, l, _ in VENDOR_RULES)),
        ("every rule label is whitelisted",
         all(l in ASSIGNABLE for _, l, _ in VENDOR_RULES + DESC_REGEX + TAXONOMY_REGEX)
         and all(l in ASSIGNABLE for l in list(DESC_SPECIFIC.values()) + list(TAXONOMY_MAP.values()))),
        ("every label has a final name" if APPLY_NAMING else "naming off — check skipped",
         all(l in FINAL_NAMES for l in ASSIGNABLE) if APPLY_NAMING else True),
        ("layer names cover every emitted code",
         set(RULE_LAYER_NAMES) >= {"T1 vendor regex", "T2a description exact",
             "T2b description regex", "T3a taxonomy exact", "T3b taxonomy regex",
             "T4 unresolved", "LLM residual", f"T1+T2 conflict -> {CONFLICT_POLICY}"}),
        ("layer names and methods align",      set(RULE_LAYER_NAMES) == set(RULE_METHOD)),
        ("llm scope and authority are valid",
         LLM_SCOPE in ("all_rows", "low_confidence_only")
         and LLM_AUTHORITY in ("low_and_medium", "low_only", "llm_wins")),
    ]
    for name, ok in inv:
        print(f"[{'PASS' if ok else 'FAIL'}] {name}")
        if not ok:
            fails.append((name, "", ""))

    if fails:
        raise AssertionError(f"{len(fails)} self-test failure(s): {fails}")
    print(f"\nAll {len(CASES)} cases and {len(inv)} invariants passed.")
else:
    print("Self-tests skipped.")