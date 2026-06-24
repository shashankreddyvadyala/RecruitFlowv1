-- ============================================================================
-- SAMPLE prediction_ready  — for testing the Phase 3 chain only.
-- In production this table is produced by Phase 1/2 (your AP invoice lines +
-- the 1024-dim GTE embedding). Replace with your real data before going live.
--
-- The rows below are crafted to MATCH rules you already loaded, so Task 3.1
-- (rules_expert) classifies them deterministically (no Vector Search / XGBoost
-- needed for these rows). accounting_date is 2022-01 to match the `month` widget.
-- ============================================================================
CREATE OR REPLACE TABLE `31500_atims_dev`.atims_taxability.prediction_ready AS
SELECT
    invoice_id, inv_line_number,
    CAST(accounting_date AS DATE)              AS accounting_date,
    final_description, vendor_name, extc, mic_cln, account_code, state,
    CAST(amount AS DOUBLE)                      AS amount,
    entity_code,
    CAST(use_tax_amount AS DOUBLE)              AS use_tax_amount,
    -- dummy 1024-dim embedding so the schema matches Phase 2 (real one comes from GTE)
    array_repeat(CAST(0.0 AS FLOAT), 1024)      AS gte_embedding
FROM VALUES
  ('INV-1001', 1, DATE'2022-01-15', 'inbound freight charge',          'ACME FREIGHT',     '48C', 'GEN', '6000', 'TX', 1200.0, 'E1',   0.0),  -- extc=48C  -> Freight (generic exact)
  ('INV-1002', 1, DATE'2022-01-15', 'software platform component',     'SOFTCO',           'GEN', 'SW',  '6500', 'CA', 8000.0, 'E1',  50.0),  -- mic=SW    -> ERTU (generic exact)
  ('INV-1003', 1, DATE'2022-01-15', 'monthly maintenance contract',    'FIXITALL',         'SVC', 'MNT', '7100', 'NY', 4500.0, 'E2',   0.0),  -- 'maintenance' keyword
  ('INV-1004', 1, DATE'2022-01-15', 'janitor supplies restock',        'CLEANCO',          'SVC', 'JAN', '7200', 'TX',  300.0, 'E1',   0.0),  -- 'janitor' keyword
  ('INV-1005', 1, DATE'2022-01-15', 'offsite records storage',         'IRON MOUNTAIN',    'SVC', 'STO', '6600', 'CA', 1500.0, 'E1',   0.0),  -- vendor IRON MOUNTAIN -> Storage Services
  ('INV-1006', 1, DATE'2022-01-15', 'quarterly pest control visit',    'BUGSBGONE',        'SVC', 'PST', '7300', 'WA',  900.0, 'E2',   0.0),  -- 'pest' keyword
  ('INV-1007', 1, DATE'2022-01-15', 'liability insurance premium',     'ASSURE INC',       'SVC', 'INS', '8100', 'CA', 5000.0, 'E1', 120.0),  -- 'insurance' keyword
  ('INV-1008', 1, DATE'2022-01-15', 'repair of access gate',           'GATEFIX',          'SVC', 'RPR', '7400', 'NY',  700.0, 'E3',   0.0)   -- 'repair' keyword
AS t(invoice_id, inv_line_number, accounting_date, final_description,
     vendor_name, extc, mic_cln, account_code, state, amount, entity_code, use_tax_amount);
 
SELECT count(*) AS rows FROM `31500_atims_dev`.atims_taxability.prediction_ready;
 
