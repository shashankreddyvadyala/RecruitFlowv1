w = Window.partitionBy(*KEYS).orderBy(col("priority").asc(), col("rule_id").asc())
best = (candidates.withColumn("_rn", row_number().over(w))
                  .filter(col("_rn") == 1).drop("_rn"))

rules_matched = (src.join(best, KEYS, "inner")
                 .withColumn("final_category", col("category"))
                 .withColumn("rule_match", lit(True))
                 .withColumn("match_type", lit("det"))
                 .drop("category"))

no_rules = src.join(best.select(*KEYS), KEYS, "leftanti")
print(f"[3.1] rule matches={rules_matched.count()}  no-rule={no_rules.count()}")
[PARSE_SYNTAX_ERROR] Syntax error at or near 'NOT'. SQLSTATE: 42601
