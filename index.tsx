write_stage(classified, STAGE["classified"])
n_resolve = classified.filter(col("ensemble_confidence") == "RESOLVE").count()
print(f"[3.2] classified: {classified.count():,}  GPT-4o resolved: {n_resolve:,}")
dbutils.notebook.exit("3.2 OK")
An exception was thrown from the Python worker. Please see the stack trace below.
[PYTHON_EXCEPTION] An exception was thrown from the Python worker: Traceback (most recent call last):
  File <command-5216493649940529>, line 7, in _score_partition
ModuleNotFoundError: No module named 'mlflow'
 SQLSTATE: 38000
