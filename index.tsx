from pyspark.sql.functions import col, lit, when

unmatched = read_stage(spark, STAGE["unmatched"])
categories = load_categories(spark)
label_arr  = sql_label_array(categories)
decoder    = load_xgb_label_decoder(spark)
print(f"[3.2] unmatched rows: {unmatched.count():,}  categories: {len(categories)}")
ValueError: category_definitions returned no labels — check the table.
