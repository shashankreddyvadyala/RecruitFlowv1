print("MONTH widget value =", MONTH)
src = spark.read.table(TABLES["prediction_ready"])
print("total rows         =", src.count())
print("rows for 2022-12   =",
      src.filter(F.date_format(F.to_date(col("accounting_date")), "yyyy-MM") == "2022-12").count())
print("rows for MONTH      =",
      src.filter(F.date_format(F.to_date(col("accounting_date")), "yyyy-MM") == MONTH).count())
