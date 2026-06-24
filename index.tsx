flag_cols = ["flag_vendor_inconsistent", "flag_amount_outlier", "flag_new_state_combo",
             "flag_rule_ml_conflict", "flag_tax_sanity", "flag_batch_outlier"]

# Treat null flags as False so missing reference tables don't poison the score.
for c in flag_cols:
    df = df.withColumn(c, F.coalesce(col(c), lit(False)))

score_expr = sum(when(col(c), 1).otherwise(0) for c in flag_cols) / lit(float(len(flag_cols)))
df = (df
      .withColumn("anomaly_score", score_expr)
      .withColumn("anomalies",
                  array_compact(array(*[when(col(c), lit(c)) for c in flag_cols])))
      .withColumn("review_priority",
                  when(col("taxability").isNull(), lit("HIGH"))
                  .when(col("anomaly_score") >= 0.5,  lit("CRITICAL"))
                  .when(col("anomaly_score") >= 0.33, lit("HIGH"))
                  .when(col("anomaly_score") > 0,     lit("MED"))
                  .otherwise(lit("LOW")))
      # Only ML rows are eligible for re-classification (AUDIT B7).
      .withColumn("override_suggested",
                  (col("anomaly_score") >= 0.33) & (col("match_type") == "ml"))
      .withColumn("recommendation", lit(None).cast("string")))

out = df.drop("_vendor_cat_freq", "_vendor_total", "_vendor_cat_ratio",
              "_amt_mean", "_amt_std")

write_stage(out, STAGE["qa"])
print("[3.5] review_priority distribution:")
out.groupBy("review_priority").count().show()
dbutils.notebook.exit("3.5 OK")
A column, variable, or function parameter with name `vendor_id` cannot be resolved. Did you mean one of the following? [`vendor_name`, `invoice_id`, `rule_id`, `amount`, `extc`]. SQLSTATE: 42703
