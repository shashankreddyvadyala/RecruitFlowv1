_rules_index = VS_INDEXES["rules"]
_num         = PARAMS["vs_num_results"]
_min_score   = PARAMS["rag_match_min_score"]


@pandas_udf("struct<final_category:string,rule_id:string,score:double>")
def rules_kb_search(text: pd.Series) -> pd.DataFrame:
    hits = vs_batch_search(_rules_index, text.tolist(), _num, columns=["category", "rule_id"])
    return pd.DataFrame([
        {"final_category": h.get("category"), "rule_id": h.get("rule_id"),
         "score": h.get("score", 0.0)} for h in hits])


scored = (no_rules
          .withColumn("_m", rules_kb_search(col("final_description")))
          .withColumn("final_category", col("_m.final_category"))
          .withColumn("rule_id", col("_m.rule_id"))
          .withColumn("confidence", col("_m.score"))
          .withColumn("rule_type", lit("rag")).drop("_m"))

rag_matched = (scored.filter(col("confidence") >= _min_score)
                     .withColumn("rule_match", lit(True))
                     .withColumn("match_type", lit("rag")))
unmatched = (scored.filter((col("confidence") < _min_score) | col("confidence").isNull())
                   .drop("final_category", "rule_id", "confidence", "rule_type")
                   .withColumn("match_type", lit("ml")))

print(f"[3.1] rag matches={rag_matched.count():,}  unmatched → ML={unmatched.count():,}")

  An exception was thrown from the Python worker. Please see the stack trace below.
[PYTHON_EXCEPTION] An exception was thrown from the Python worker: Traceback (most recent call last):
  File <command-5216493649938827>, line 8, in rules_kb_search
  File <command-5216493649938778>, line 25, in vs_batch_search
ModuleNotFoundError: No module named 'databricks.vector_search'
