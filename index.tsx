df.createOrReplaceTempView("unmatched_temp")
df = spark.sql(f"""
    SELECT *,
           ai_classify(final_description, {label_arr}) AS llm_pred
    FROM unmatched_temp
""")
[AI_FUNCTION_COMPILATION_ERROR] An error occurred while compiling the AI function: INVALID_ARGUMENT: Must provide no more than 20 unique labels. SQLSTATE: 42883; line 3 pos 11
