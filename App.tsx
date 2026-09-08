@uc7917_ATT commented on this pull request.
Please make sure to first change the directory to the proper one outlined in the comments then take a look at the comments and resolve or lets discuss if i got anything wrong
________________________________________
On aifintax_commons/ATIMS_Taxability/classification_rules.sql:
The directory is incorrect, all these files needs to under atims/atims_databricks_notebooks/Taxability
________________________________________
In aifintax_commons/ATIMS_Taxability/config_notebook.py:
> +
+# ---------------------------------------------------------------------------
+# Accounting month to process (YYYY-MM). Edit this ONE line to pick the month.
+# Deliberately NOT a widget: widget values are sticky per-notebook and were the
+# cause of Task 3.1 filtering to an empty month. A plain variable cannot get
+# stuck. Must be a month that exists in prediction_ready.<PERIOD_COL>.
+#
+# PERIOD_COL is the column that defines the tax period. `accounting_date` is the
+# default because every line has exactly one accounting month, so consecutive
+# monthly runs partition the source with no gaps and no overlaps. `invoice_month`
+# does NOT have that property in the real feed — the two disagree on a small
+# number of lines each month (48 of 7,281 in the 2023-01 sample), and running on
+# invoice_month would silently drop the lines whose invoice and accounting months
+# straddle a boundary.
+# ---------------------------------------------------------------------------
+MONTH      = "2022-12"
If Month is not a widget how do we make this dynamic for the automated pipeline?
________________________________________
In aifintax_commons/ATIMS_Taxability/config_notebook.py:
> +            k, v, t = r["config_key"], r["config_value"], r["value_type"]
+            if k in p and v is not None:
+                p[k] = int(v) if t == "int" else float(v) if t == "float" else v
+        print("[config] thresholds loaded from pipeline_config")
+    except Exception as e:
+        print(f"[config] pipeline_config unavailable ({e}); using default thresholds.")
+    return p
+
+
+PARAMS = _load_params(spark)
+
+# ---------------------------------------------------------------------------
+# Downstream notification (use a Secret Scope for the real value)
+# ---------------------------------------------------------------------------
+try:
+    WEBHOOK_URL = dbutils.secrets.get(scope="atims", key="phase3_webhook_url")
if this is for the eventual updating of the status on the UI, this wont be necessary, we will be updating the status and sending notifications in a different way. Please remove references to this
________________________________________
In aifintax_commons/ATIMS_Taxability/load_prediction_ready.py:
> +# MAGIC 3. Set `MONTH` in `config_notebook` to one of the months this prints
+# MAGIC    (e.g. **2023-01**). There is no month widget any more.
+# MAGIC
+# MAGIC Keep the raw column names and the raw values — do NOT clean the export here.
+# MAGIC `normalize_input` in `config_notebook` owns the mapping (lowercasing, the
+# MAGIC literal-'null' strings, mic_cln, amount, use_tax_amount, state, line_uid),
+# MAGIC so cleaning in two places is how the two drift apart.
+
+# COMMAND ----------
+
+catalog = "31500_atims_dev"
+schema  = "atims_taxability"
+
+# Real ML input location (ADLS Gen2). The cluster must already have access to
+# the nprdatimsstore storage account (UC external location / credential passthrough).
+source_path   = "abfss://atims@nprdatimsstore.dfs.core.windows.net/TAXABILITY_DATA/ML_INPUT"
the container and storage account need to be dynamically settable as there will be different environments
________________________________________
In aifintax_commons/ATIMS_Taxability/mlflow_tracking_notebook.py:
> +
+import mlflow, hashlib, json, os
+import pandas as pd
+from pyspark.sql.functions import col, lit
+from mlflow.tracking import MlflowClient
+
+# MLFLOW_REGISTRY_URI / REGISTERED_MODEL / MLFLOW_EXPERIMENT come from config_notebook
+mlflow.set_registry_uri(MLFLOW_REGISTRY_URI)
+try:
+    _user = spark.sql("SELECT current_user() AS u").collect()[0]["u"]
+except Exception:
+    _user = "unknown"
+EXPERIMENT_PATH = MLFLOW_EXPERIMENT or f"/Users/{_user}/atims_phase3"
+mlflow.set_experiment(EXPERIMENT_PATH)
+print(f"[3.8] experiment={EXPERIMENT_PATH}  registry={MLFLOW_REGISTRY_URI}  model={REGISTERED_MODEL}")
+
Experiment path should not be dependent on the user, it should only resolve to the UC Registered experiment so the user fall back shouldn't be necessary
________________________________________
In aifintax_commons/ATIMS_Taxability/mlflow_tracking_notebook.py:
> +try:
+    cfg_pd = spark.read.table(TABLES["pipeline_config"]).toPandas()
+    config_dict = dict(zip(cfg_pd["config_key"], cfg_pd["config_value"]))
+except Exception as e:
+    config_dict = {"_error": str(e)}
+
+print(f"[3.8] rows={total:,}  match_type={mt}  tax_source={ts}  "
+      f"rules_active={rule_total} hash={rule_hash}")
+
+# COMMAND ----------
+
+# MAGIC %md
+# MAGIC ### Log the MLflow run (params + metrics + artifacts)
+
+# COMMAND ----------
+
We need to see if we can avoid using the temporary directory, lets discuss using either storage account to temporarily keep the csv's, using in memory jsons, etc.
________________________________________
In aifintax_commons/ATIMS_Taxability/run_all_pipeline.py:
> +# COMMAND ----------
+
+output_path = "dbfs:/Workspace/Users/sr865s@att.com/ATIMS_Taxability_Updated/Output.csv"
+
+# Read the CSV file into a Spark DataFrame (assumes header row)
+df_output = spark.read.format("csv") \
+    .option("header", "true") \
+    .option("inferSchema", "true") \
+    .load(output_path)
+
+# Display the contents
+display(df_output)
+
+# COMMAND ----------
+
+# Define current date for the query
Im assuming everything below here is from a different project, please remove
________________________________________
In aifintax_commons/ATIMS_Taxability/write_output_notebook.py:
> +total   = final.count()
+flagged = final.filter(col("review_priority").isin("HIGH", "CRITICAL")).count()
+print(f"[3.7] wrote {total:,} rows → {TABLES['predictions_out']}  (flagged: {flagged:,})")
+
+print("[3.7] review queue by root cause:")
+(final.groupBy("tax_source", "review_priority").count()
+      .orderBy(col("count").desc()).show(20, truncate=False))
+
+# COMMAND ----------
+
+# MAGIC %md
+# MAGIC ### Notify FastAPI backend
+
+# COMMAND ----------
+
+def _notify(month, records_processed, flagged_count):
we will not need the web_hook logic
________________________________________
In aifintax_commons/ATIMS_Taxability/qa_notebook.py:
> +
+# MAGIC %md
+# MAGIC ### Check 4 — rule vs classifier conflict (ML cols may be null on rule rows)
+
+# COMMAND ----------
+
+# xgboost_pred only exists on the ML branch; unionByName leaves it NULL on
+# rule/RAG rows, and it is absent entirely when Task 3.2 ran without the
+# embedding column. Guard so the check degrades instead of raising.
+if "xgboost_pred" not in df.columns:
+    print("[3.5] xgboost_pred absent; check 4 (rule vs ML conflict) skipped.")
+    df = df.withColumn("flag_rule_ml_conflict", lit(False))
+else:
+    df = df.withColumn(
+        "flag_rule_ml_conflict",
+        (col("match_type").isin("det", "rag")) & col("xgboost_pred").isNotNull()
Opus comment:
QA Check 4 (rule-vs-classifier conflict) can never fire
xgboost_pred is only populated on the ML branch (classifier_notebook.py). On det/rag rows it is filled with NULL by the unionByName(..., allowMissingColumns=True) in tax_lookup_notebook.py. So match_type IN ('det','rag') AND xgboost_pred IS NOT NULL is always false — Check 4 never triggers. The architecture doc lists this cross-validation as a core QA check; it is effectively dead. To do what's intended you'd need to score XGBoost on rule-matched rows too (or compare against the llm_pred/RAG category instead).
________________________________________
In aifintax_commons/ATIMS_Taxability/reroute_notebook.py:
> +for p in range(1, max_passes + 1):
+    n = flagged.count()
+    if n == 0:
+        break
+    print(f"[3.6] pass {p}/{max_passes} on {n:,} flagged ML records...")
+
+    # Re-classify (with QA hint) → matrix → use-tax.
+    re = reclassify_with_hint(flagged)
+    re = matrix_join(re)
+    re = use_tax(re)
+    re = re.withColumn("iteration", lit(p)) \
+           .withColumn("override_suggested", lit(False))  # re-QA in 3.5 on next full run
+
+    clean   = clean.unionByName(re, allowMissingColumns=True)
+    flagged = flagged.limit(0)   # single resolution pass per record; loop guard
+
Opus comment:
Reroute only ever runs one pass, and the CRITICAL-escalation branch is unreachable
flagged is emptied on the first iteration, so max_reroute_passes = 2 from pipeline_config is ignored — the loop always does exactly one pass. Consequently the post-loop escalation:
is dead code — flagged is always empty here, so nothing is ever escalated to CRITICAL by reroute. This contradicts the architecture ("max 2 passes… remaining anomalies → ESCALATION").
________________________________________
In aifintax_commons/ATIMS_Taxability/reroute_notebook.py:
> +
+    # Re-classify (with QA hint) → matrix → use-tax.
+    re = reclassify_with_hint(flagged)
+    re = matrix_join(re)
+    re = use_tax(re)
+    re = re.withColumn("iteration", lit(p)) \
+           .withColumn("override_suggested", lit(False))  # re-QA in 3.5 on next full run
+
+    clean   = clean.unionByName(re, allowMissingColumns=True)
+    flagged = flagged.limit(0)   # single resolution pass per record; loop guard
+
+# Anything still flagged after the cap → CRITICAL escalation.
+if flagged.count() > 0:
+    clean = clean.unionByName(
+        flagged.withColumn("review_priority", lit("CRITICAL")), allowMissingColumns=True)
+
Reroute also should re run tax writer to create a new writeup if the classification changed
