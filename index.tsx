from pyspark.sql import functions as F
from pyspark.sql.functions import col

catalog, schema = "31500_atims_dev", "atims_taxability"
try:
    print("month widget =", dbutils.widgets.get("month"))
except Exception as e:
    print("no month widget yet:", e)

src = spark.table(f"`{catalog}`.{schema}.prediction_ready")
print("total rows       =", src.count())
print("rows for 2022-12 =",
      src.filter(F.date_format(F.to_date(col("accounting_date")), "yyyy-MM") == "2022-12").count())
