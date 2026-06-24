-- ============================================================================
-- ATIMS Phase 3 — governed reference tables (run once; re-run to reseed)
-- Paste into a Databricks SQL editor or %sql notebook cell.
-- Adjust the catalog/schema below to match your workspace.
-- ============================================================================
 
-- ---- classification_rules ---------------------------------------------------
CREATE TABLE IF NOT EXISTS atims_shared.reference.classification_rules (
    rule_id            STRING  NOT NULL  COMMENT 'Unique rule identifier',
    rule_type          STRING            COMMENT 'exact_match | account_range | vendor | keyword',
    priority           INT               COMMENT 'Lower = evaluated first; first match wins',
    active             BOOLEAN           COMMENT 'Toggle a rule on/off without deleting it',
    effective_from     DATE              COMMENT 'Applies on/after this date (null = always)',
    effective_to       DATE              COMMENT 'Applies on/before this date (null = open-ended)',
    extc               STRING            COMMENT 'Match key: expenditure type code (nullable)',
    mic_cln            STRING            COMMENT 'Match key: material/item code (nullable)',
    account_code       STRING            COMMENT 'Match key: exact GL account (exact_match)',
    account_code_from  STRING            COMMENT 'Account range lower bound (account_range)',
    account_code_to    STRING            COMMENT 'Account range upper bound (account_range)',
    vendor_id          STRING            COMMENT 'Match key: vendor id (vendor rule)',
    keyword            STRING            COMMENT 'Substring matched in final_description (keyword rule)',
    category           STRING  NOT NULL  COMMENT 'Output classification when the rule matches',
    confidence         DOUBLE            COMMENT 'Confidence assigned (default 1.0)',
    description        STRING            COMMENT 'Human note on the rule',
    created_by         STRING,
    created_at         TIMESTAMP,
    updated_at         TIMESTAMP
)
USING DELTA
COMMENT 'Governed classification rules engine for Phase 3 Task 3.1 (rules_expert).';
 
-- Idempotent reseed: clear then insert a representative starter set.
-- DELETE only the seed rows so you can keep your own rules across re-runs;
-- here we clear everything for a clean install — remove this line to append.
DELETE FROM atims_shared.reference.classification_rules;
 
INSERT INTO atims_shared.reference.classification_rules
( rule_id, rule_type, priority, active, effective_from, effective_to,
  extc, mic_cln, account_code, account_code_from, account_code_to,
  vendor_id, keyword, category, confidence, description, created_by, created_at, updated_at )
VALUES
 ('R-CBL',        'exact_match',   10, true,  DATE'2020-01-01', NULL,
   'ELEC','CBL','6000', NULL, NULL, NULL, NULL, 'Cable - Metallic', 1.0,
   'Electrical cable on GL 6000', 'seed', current_timestamp(), current_timestamp()),
 ('R-FRT',        'exact_match',   10, true,  DATE'2020-01-01', NULL,
   'FRT','SHP','7000', NULL, NULL, NULL, NULL, 'Freight', 1.0,
   'Freight/shipping on GL 7000', 'seed', current_timestamp(), current_timestamp()),
 ('R-SW-ACCT',    'account_range', 30, true,  DATE'2020-01-01', NULL,
   'SOFT', NULL, NULL, '6500', '6599', NULL, NULL, 'Software License', 0.95,
   'Software expenditure in GL 6500-6599', 'seed', current_timestamp(), current_timestamp()),
 ('R-VEND-SEC',   'vendor',        40, true,  DATE'2020-01-01', NULL,
   NULL, NULL, NULL, NULL, NULL, 'V5', NULL, 'Security Service', 0.90,
   'Vendor V5 always Security Service', 'seed', current_timestamp(), current_timestamp()),
 ('R-KW-STORAGE', 'keyword',       50, true,  DATE'2020-01-01', NULL,
   NULL, NULL, NULL, NULL, NULL, NULL, 'storage', 'Storage Services', 0.85,
   'Description mentions storage', 'seed', current_timestamp(), current_timestamp()),
 ('R-KW-ROUTER',  'keyword',       50, true,  DATE'2020-01-01', NULL,
   NULL, NULL, NULL, NULL, NULL, NULL, 'router', 'Network Equipment', 0.85,
   'Description mentions router', 'seed', current_timestamp(), current_timestamp()),
 ('R-OLD-EXAMPLE','exact_match',   10, false, DATE'2019-01-01', DATE'2019-12-31',
   'ELEC','CBL','6000', NULL, NULL, NULL, NULL, 'Cable - Metallic', 1.0,
   'Inactive/expired example (ignored by the pipeline)', 'seed', current_timestamp(), current_timestamp());
 
 
-- ---- pipeline_config --------------------------------------------------------
CREATE TABLE IF NOT EXISTS atims_shared.reference.pipeline_config (
    config_key   STRING NOT NULL COMMENT 'Tunable name',
    config_value STRING          COMMENT 'Value (stored as string)',
    value_type   STRING          COMMENT 'int | float | string — how to cast on read',
    description  STRING,
    updated_at   TIMESTAMP
)
USING DELTA
COMMENT 'Pipeline thresholds/tunables consumed by config_notebook.';
 
DELETE FROM atims_shared.reference.pipeline_config;
 
INSERT INTO atims_shared.reference.pipeline_config VALUES
 ('agreement_high_conf', '0.80', 'float', 'XGBoost conf above which agreement = HIGH/ACCEPT',       current_timestamp()),
 ('rag_match_min_score', '0.75', 'float', 'Vector Search score floor for a strong rule match',       current_timestamp()),
 ('max_reroute_passes',  '2',    'int',   'Task 3.6 iteration cap',                                  current_timestamp()),
 ('vs_num_results',      '1',    'int',   'Nearest neighbours retrieved per Vector Search query',    current_timestamp()),
 ('amount_z_flag',       '3.0',  'float', 'QA z-score above which an amount is an outlier',          current_timestamp());
 
 
-- ---- quick checks -----------------------------------------------------------
SELECT rule_type, active, count(*) AS n
FROM atims_shared.reference.classification_rules
GROUP BY rule_type, active ORDER BY rule_type, active;
 
SELECT * FROM atims_shared.reference.pipeline_config ORDER BY config_key;
 
