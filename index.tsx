import mlflow, hashlib, json, os
import pandas as pd
from mlflow.tracking import MlflowClient

# MLFLOW_REGISTRY_URI / REGISTERED_MODEL / MLFLOW_EXPERIMENT come from config_notebook
mlflow.set_registry_uri(MLFLOW_REGISTRY_URI)
try:
    _user = spark.sql("SELECT current_user() AS u").collect()[0]["u"]
except Exception:
    _user = "unknown"
EXPERIMENT_PATH = MLFLOW_EXPERIMENT or f"/Users/{_user}/atims_phase3"
mlflow.set_experiment(EXPERIMENT_PATH)
print(f"[3.8] experiment={EXPERIMENT_PATH}  registry={MLFLOW_REGISTRY_URI}  model={REGISTERED_MODEL}")

%pip install -q -U "typing_extensions>=4.10" mlflow
dbutils.library.restartPython()
