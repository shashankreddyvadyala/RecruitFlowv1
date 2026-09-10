fix(atims/taxability): address PR review — env-driven config, live QA check, working reroute loop

Relocate to atims/atims_databricks_notebooks/Taxability.

- MONTH: resolve from job parameter -> MONTH_OVERRIDE -> previous
  calendar month, format-validated and logged with its source. Widget
  default is empty so a stale value can never be silently inherited,
  which was the original reason for hard-coding it.
- classification_rules.sql: catalog/schema from widgets, unqualified
  table names. No find/replace needed to promote.
- Remove the FastAPI webhook from config_notebook and
  write_output_notebook; status is handled outside this pipeline.
- MLflow: drop the driver temp directory. Log the rule snapshot and
  output sample from memory via log_dict(); the registered pyfunc model
  carries the manifest as an attribute instead of an artifact file.
- QA check 4 was dead: match_type IN ('det','rag') AND xgboost_pred IS
  NOT NULL can never be true, since xgboost_pred is NULL on every
  rule/RAG row after unionByName. Rewritten against t32_rule_audit,
  which scores an independent model on rule-matched rows.
- Reroute: remove `flagged = flagged.limit(0)`, which ended the loop
  after one pass and left the CRITICAL escalation unreachable. Rows are
  resolved when re-classification changes the category; unresolved rows
  carry to the next pass with the attempt number in the hint; anything
  left after max_passes escalates.



    ## What changed

Addresses the review comments on the ATIMS Phase 3 taxability pipeline.
Files moved to `atims/atims_databricks_notebooks/Taxability/`.

### Review comments

| Comment | Resolution |
|---|---|
| Wrong directory | Moved to `atims/atims_databricks_notebooks/Taxability/` |
| MONTH not dynamic for the automated pipeline | Resolves from job parameter `month` → `MONTH_OVERRIDE` → previous calendar month |
| Remove webhook (config) | Removed; no references remain |
| Remove webhook (write_output) | `_notify`, `urllib` call and secret lookup removed |
| Storage account/container must be per-env | Already in `ENV_CONFIG`; also parameterised `classification_rules.sql`, which still hard-coded the dev catalog |
| MLflow experiment must not depend on user | Already resolves strictly to the UC experiment and raises if unregistered — no `current_user()` fallback |
| Avoid the temp directory | No `/tmp` or `tempfile` anywhere; artifacts logged in memory |
| Remove other project's code from run_all | Already removed |
| QA check 4 can never fire | Rewritten — see below |
| Reroute runs one pass; escalation unreachable | Loop fixed — see below |
| Reroute must regenerate the write-up | Already present, with an assertion that no re-classified row keeps a stale write-up |

### QA check 4

Your diagnosis was right: `xgboost_pred` is only populated on the ML
branch and is NULL on every rule/RAG row after
`unionByName(..., allowMissingColumns=True)`, so the condition was never
true and the cross-validation the architecture calls for was not
happening.

One deviation from the suggested fix worth discussing. Scoring the
*decision* model on rule-matched rows recreates the problem in subtler
form — that model is trained on those labels and agrees with them
~100% of the time, so the check would fire on nothing useful.

Instead, Task 3.2 trains a second model on **high-precision labels only**
(exact_match / vendor / expression) and scores it against the
keyword-tier rows. It has never seen the labels it is checking, so a
disagreement is independent evidence. Results land in `t32_rule_audit`;
QA joins it and flags `flag_rule_model_conflict`. The rule always wins —
this only raises the row for review. Fires on 219 rows in the sample
month.

### Reroute loop

`flagged = flagged.limit(0)` ended the loop after one iteration
regardless of `max_reroute_passes`, making the CRITICAL escalation
unreachable. Now: a row is resolved when re-classification changes the
category and moves to `clean`; an unchanged category means the pass did
not resolve it, so it carries forward with the attempt number added to
the hint (re-sending an identical prompt returns an identical answer);
anything unresolved after `max_passes` escalates to CRITICAL with a
reviewer note.

## Testing

Executed end-to-end against a 7,071-row ML_INPUT export on a local Spark
harness (`local_harness/`): all 8 tasks pass for all four accounting
months, 7,071 rows in / 7,071 out, zero row loss.

Not covered locally: Unity Catalog, Vector Search, Model Serving, the
MLflow registry, and ADLS. In particular the `CREATE WIDGET` syntax in
the SQL notebook and `mlflow.log_dict` under serverless have not been
run on a real cluster.

## Open before merge

- `ENV_CONFIG` still contains `REPLACE_QA_*` / `REPLACE_PROD_*`
  placeholders. The mechanism is in place; the values are not.
- If any consumer outside these notebooks reads
  `non_norad_predictions` by name, confirm before any rename.
