# Install mlflow if needed
%pip install -q mlflow

import mlflow, hashlib, json, os
import pandas as pd
from mlflow.tracking import MlflowClient

# Safely obtain configuration variables (fallback to env vars or defaults)
MLFLOW_REGISTRY_URI = globals().get("MLFLOW_REGISTRY_URI", os.getenv("MLFLOW_REGISTRY_URI", "databricks"))
REGISTERED_MODEL   = globals().get("REGISTERED_MODEL",   os.getenv("REGISTERED_MODEL",   "atims_phase3_model"))
MLFLOW_EXPERIMENT  = globals().get("MLFLOW_EXPERIMENT",  os.getenv("MLFLOW_EXPERIMENT"))

# Route the registry at Unity Catalog and pick the experiment.
mlflow.set_registry_uri(MLFLOW_REGISTRY_URI)

try:
    _user = spark.sql("SELECT current_user() AS u").collect()[0]["u"]
except Exception:
    _user = "unknown"

EXPERIMENT_PATH = MLFLOW_EXPERIMENT or f"/Users/{_user}/atims_phase3"
mlflow.set_experiment(EXPERIMENT_PATH)

print(f"[3.8] experiment={EXPERIMENT_PATH}  registry={MLFLOW_REGISTRY_URI}  model={REGISTERED_MODEL}")
ImportError: cannot import name 'Sentinel' from 'typing_extensions' (/databricks/python/lib/python3.10/site-packages/typing_extensions.py)
