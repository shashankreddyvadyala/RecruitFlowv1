-- ============================================================================
-- ATIMS — fix_expression_rules.sql
-- Repairs the 50 expression rules whose match_expression lost literal quoting
-- during migration (root cause of the [CAST_INVALID_INPUT] '2003.845C' crash
-- in Task 3.1 and of expression rules never matching in any prior run).
-- Surgical: updates ONLY match_expression on rule_type='expression' rows.
-- All other rule types and columns are untouched.
-- ============================================================================

-- 1) Backup (idempotent-ish: fails if it already exists, which is fine)
CREATE TABLE IF NOT EXISTS `31500_atims_dev`.atims_taxability.classification_rules_bak_20260823
AS SELECT * FROM `31500_atims_dev`.atims_taxability.classification_rules;

-- 2) Corrected predicates (quoted literals; column renames already applied)
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'extc = ''520'' AND mic_cln = ''COE1K'' OR mic_cln = ''COEOTHER''', updated_at = current_timestamp() WHERE rule_id = 'GEN-003' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'mic_cln = ''COE10K'' OR mic_cln = ''CHROR1K''', updated_at = current_timestamp() WHERE rule_id = 'GEN-004' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'mic_cln = ''CPEMIS'' OR mic_cln = ''CPERTR''', updated_at = current_timestamp() WHERE rule_id = 'GEN-005' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'account_code = ''399C'' AND extc = ''61J''', updated_at = current_timestamp() WHERE rule_id = 'GEN-007' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'mic_cln = ''COEOTHER'' AND extc = ''450''', updated_at = current_timestamp() WHERE rule_id = 'GEN-008' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'mic_cln = ''CPEMIS'' AND extc = ''48C''', updated_at = current_timestamp() WHERE rule_id = 'GEN-009' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'mic_cln = ''COEOTHER'' AND extc = ''460''', updated_at = current_timestamp() WHERE rule_id = 'GEN-010' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'account_code = ''6124.570M'' AND extc = ''6A9''', updated_at = current_timestamp() WHERE rule_id = 'GEN-011' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'account_code = ''1220.121'' OR account_code = ''1220.147''', updated_at = current_timestamp() WHERE rule_id = 'GEN-012' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'account_code LIKE ''4010%'' AND final_description NOT LIKE ''%freight charges%''', updated_at = current_timestamp() WHERE rule_id = 'GEN-013' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'mic_cln LIKE ''SEQ%''', updated_at = current_timestamp() WHERE rule_id = 'GEN-016' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'mic_cln LIKE ''NEQ%''', updated_at = current_timestamp() WHERE rule_id = 'GEN-017' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'mic_cln LIKE ''TOWER%''', updated_at = current_timestamp() WHERE rule_id = 'GEN-018' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'mic_cln LIKE ''ANT%'' AND mic_cln LIKE ''%K''', updated_at = current_timestamp() WHERE rule_id = 'GEN-019' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'mic_cln LIKE ''EFI%'' AND extc = ''450''', updated_at = current_timestamp() WHERE rule_id = 'GEN-020' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'mic_cln LIKE ''CEQ%''', updated_at = current_timestamp() WHERE rule_id = 'GEN-021' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'extc = ''450'' AND account_code = ''2003.85C''', updated_at = current_timestamp() WHERE rule_id = 'GEN-022' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'extc = ''460'' AND account_code = ''2003.85C''', updated_at = current_timestamp() WHERE rule_id = 'GEN-023' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'extc LIKE ''894%''', updated_at = current_timestamp() WHERE rule_id = 'GEN-024' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'account_code LIKE ''1130%''', updated_at = current_timestamp() WHERE rule_id = 'GEN-025' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name = ''IRON MOUNTAIN''', updated_at = current_timestamp() WHERE rule_id = 'GEN-026' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'final_description LIKE ''%landscape%'' AND account_code = ''6121.235'' AND company_code = ''SS00''', updated_at = current_timestamp() WHERE rule_id = 'GEN-027' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'final_description LIKE ''landscape gravel%'' AND company_code = ''TTOO''', updated_at = current_timestamp() WHERE rule_id = 'GEN-028' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'final_description LIKE ''base Service%'' AND account_code = ''6123.91''', updated_at = current_timestamp() WHERE rule_id = 'GEN-029' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'final_description = ''fiber'' AND account_code = ''6114.1''', updated_at = current_timestamp() WHERE rule_id = 'GEN-030' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'final_description LIKE ''%ceeot%'' AND extc = ''455''', updated_at = current_timestamp() WHERE rule_id = 'GEN-031' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'final_description LIKE ''%ceeot%'' AND extc = ''465''', updated_at = current_timestamp() WHERE rule_id = 'GEN-032' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'final_description LIKE ''%ceeot%'' AND extc = ''520''', updated_at = current_timestamp() WHERE rule_id = 'GEN-033' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name = ''DIVERSIFIED WIRE & CABLE INC''', updated_at = current_timestamp() WHERE rule_id = 'GEN-034' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name = ''CISCO SYSTEMS CAPITAL CORP>9I''', updated_at = current_timestamp() WHERE rule_id = 'GEN-035' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name = ''TEKSYSTEMS INC>9M''', updated_at = current_timestamp() WHERE rule_id = 'GEN-036' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name = ''JK COMMUNICATIONS & CONSTRUCTION>9L''', updated_at = current_timestamp() WHERE rule_id = 'GEN-038' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name = ''AMERICAN SAFETY UTILITY CORP>9B''', updated_at = current_timestamp() WHERE rule_id = 'GEN-039' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name = ''IMAGE SOLUTIONS APPAREL INC''', updated_at = current_timestamp() WHERE rule_id = 'GEN-040' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name = ''SAF T GARD INTERNATIONAL INC''', updated_at = current_timestamp() WHERE rule_id = 'GEN-041' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name = ''SOUTHLAND ENTERPRISES>2''', updated_at = current_timestamp() WHERE rule_id = 'GEN-042' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name = ''STANLEY CONVERGENT''', updated_at = current_timestamp() WHERE rule_id = 'GEN-043' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'company_code = ''7M39''', updated_at = current_timestamp() WHERE rule_id = 'GEN-044' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name LIKE ''CANTEEN ONE%''', updated_at = current_timestamp() WHERE rule_id = 'GEN-045' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name LIKE ''ARAMARK REFRESHMENT SERVICES%''', updated_at = current_timestamp() WHERE rule_id = 'GEN-046' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'account_code = ''6114.1'' AND final_description LIKE ''%insulated gloves%''', updated_at = current_timestamp() WHERE rule_id = 'GEN-048' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'extc = ''520'' AND account_code LIKE ''%M''', updated_at = current_timestamp() WHERE rule_id = 'GEN-049' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name = ''AMERICAN SAFETY UTILITY CORP'' AND extc = ''9B''', updated_at = current_timestamp() WHERE rule_id = 'PV-002' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name = ''ALLIED UNIVERSAL'' AND extc = ''9I''', updated_at = current_timestamp() WHERE rule_id = 'PV-003' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name = ''LINCOLN CONTROLS INC'' AND extc = ''1''', updated_at = current_timestamp() WHERE rule_id = 'PV-007' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name = ''LOOMIS FARGO & CO'' AND extc = ''9M''', updated_at = current_timestamp() WHERE rule_id = 'PV-008' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name = ''THE MORNING CONSULT LLC'' AND extc = ''9I''', updated_at = current_timestamp() WHERE rule_id = 'PV-011' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name = ''VMWARE INC'' AND extc = ''9I''', updated_at = current_timestamp() WHERE rule_id = 'PV-019' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name = ''SAIA LOGISTICS SERVICES LLC'' AND extc = ''9I''', updated_at = current_timestamp() WHERE rule_id = 'PV-021' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name = ''MATRIX RESOURCES INC'' AND extc = ''9I''', updated_at = current_timestamp() WHERE rule_id = 'PV-031' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name = ''SIENA ENGINEERING GROUP INC'' AND extc = ''9L''', updated_at = current_timestamp() WHERE rule_id = 'PV-034' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name = ''PARALLEL TOWERS III LLC'' AND extc = ''1''', updated_at = current_timestamp() WHERE rule_id = 'PV-035' AND rule_type = 'expression';
UPDATE `31500_atims_dev`.atims_taxability.classification_rules SET match_expression = 'vendor_name = ''PARALLEL TOWERS III LLC'' AND extc = ''1''', updated_at = current_timestamp() WHERE rule_id = 'PV-036' AND rule_type = 'expression';

-- 3) Verify: every non-null expression predicate now contains quoted literals
SELECT rule_id, match_expression
FROM `31500_atims_dev`.atims_taxability.classification_rules
WHERE rule_type = 'expression' AND match_expression IS NOT NULL
  AND match_expression NOT LIKE "%'%";
-- ^ expect ZERO rows

-- 4) Verify: nothing else changed vs backup
SELECT count(*) AS non_expression_diffs
FROM `31500_atims_dev`.atims_taxability.classification_rules c
JOIN `31500_atims_dev`.atims_taxability.classification_rules_bak_20260823 b
  ON c.rule_id = b.rule_id
WHERE c.rule_type != 'expression'
  AND (c.category != b.category OR coalesce(c.keyword,'') != coalesce(b.keyword,'')
       OR coalesce(c.vendor_name,'') != coalesce(b.vendor_name,''));
-- ^ expect 0
