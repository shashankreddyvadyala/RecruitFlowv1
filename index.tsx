CREATE OR REPLACE TABLE `31500_atims_dev`.atims_taxability.category_definitions AS
SELECT DISTINCT category AS cluster,
       'auto-derived from classification_rules' AS definition
FROM `31500_atims_dev`.atims_taxability.classification_rules
WHERE category IS NOT NULL;

-- ---- xgboost label index (label_index -> cluster) ---------------------------
CREATE OR REPLACE TABLE `31500_atims_dev`.atims_taxability.xgboost_non_norad_label_index AS
SELECT CAST(row_number() OVER (ORDER BY cluster) - 1 AS INT) AS label_index, cluster
FROM (SELECT DISTINCT category AS cluster
      FROM `31500_atims_dev`.atims_taxability.classification_rules
      WHERE category IS NOT NULL);

-- ---- taxability_matrix: category x state -> taxability -----------------------
-- SAMPLE: defaults everything to 'Taxable'. Replace with your real matrix.
CREATE OR REPLACE TABLE `31500_atims_dev`.atims_taxability.taxability_matrix AS
SELECT c.cluster, s.state, 'Taxable' AS taxability
FROM (SELECT DISTINCT category AS cluster
      FROM `31500_atims_dev`.atims_taxability.classification_rules
      WHERE category IS NOT NULL) c
CROSS JOIN (SELECT DISTINCT state
            FROM `31500_atims_dev`.atims_taxability.prediction_ready
            WHERE state IS NOT NULL) s;

-- ---- historical_stats: (category,state) combos already "seen" ---------------
CREATE OR REPLACE TABLE `31500_atims_dev`.atims_taxability.historical_stats AS
SELECT cluster AS final_category, state
FROM `31500_atims_dev`.atims_taxability.taxability_matrix;

-- ---- state_service_tax_rules: state -> service_taxable ----------------------
-- SAMPLE: every state taxes services (true). Set false for no-service-tax states.
CREATE OR REPLACE TABLE `31500_atims_dev`.atims_taxability.state_service_tax_rules AS
SELECT DISTINCT state, CAST(true AS BOOLEAN) AS service_taxable
FROM `31500_atims_dev`.atims_taxability.prediction_ready
WHERE state IS NOT NULL;

-- ---- quick checks -----------------------------------------------------------
SELECT 'category_definitions' AS tbl, count(*) n FROM `31500_atims_dev`.atims_taxability.category_definitions
UNION ALL SELECT 'taxability_matrix',  count(*) FROM `31500_atims_dev`.atims_taxability.taxability_matrix
UNION ALL SELECT 'historical_stats',   count(*) FROM `31500_atims_dev`.atims_taxability.historical_stats
UNION ALL SELECT 'state_service_rules',count(*) FROM `31500_atims_dev`.atims_taxability.state_service_tax_rules
UNION ALL SELECT 'xgb_label_index',    count(*) FROM `31500_atims_dev`.atims_taxability.xgboost_non_norad_label_index;
