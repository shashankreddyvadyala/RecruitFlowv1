testing 50 live expression rules over the month...
GUILTY: GEN-003 :: extc = 520 AND mic_cln = COE1K OR mic_cln = COEOTHER
   -> [UNRESOLVED_COLUMN.WITH_SUGGESTION] A column, variable, or function parameter with name `COE1K` cannot be resolved. Did you mean one of the following? [`mic`, `extc`, `state`, `amount`, `source`]. SQL
GUILTY: GEN-004 :: mic_cln = COE10K OR mic_cln = CHROR1K
   -> [UNRESOLVED_COLUMN.WITH_SUGGESTION] A column, variable, or function parameter with name `COE10K` cannot be resolved. Did you mean one of the following? [`extc`, `mic`, `state`, `amount`, `source`]. SQ
GUILTY: GEN-005 :: mic_cln = CPEMIS OR mic_cln = CPERTR
   -> [UNRESOLVED_COLUMN.WITH_SUGGESTION] A column, variable, or function parameter with name `CPEMIS` cannot be resolved. Did you mean one of the following? [`extc`, `mic`, `state`, `amount`, `source`]. SQ
GUILTY: GEN-007 :: account_code = 399C AND extc = 61J
   -> [UNRESOLVED_COLUMN.WITH_SUGGESTION] A column, variable, or function parameter with name `399C` cannot be resolved. Did you mean one of the following? [`extc`, `mic`, `state`, `amount`, `source`]. SQLS
GUILTY: GEN-008 :: mic_cln = COEOTHER AND extc = 450
   -> [UNRESOLVED_COLUMN.WITH_SUGGESTION] A column, variable, or function parameter with name `COEOTHER` cannot be resolved. Did you mean one of the following? [`amount`, `extc`, `mic`, `source`, `state`]. 
GUILTY: GEN-009 :: mic_cln = CPEMIS AND extc = 48C
   -> [UNRESOLVED_COLUMN.WITH_SUGGESTION] A column, variable, or function parameter with name `CPEMIS` cannot be resolved. Did you mean one of the following? [`extc`, `mic`, `state`, `amount`, `source`]. SQ
GUILTY: GEN-010 :: mic_cln = COEOTHER AND extc = 460
   -> [UNRESOLVED_COLUMN.WITH_SUGGESTION] A column, variable, or function parameter with name `COEOTHER` cannot be resolved. Did you mean one of the following? [`amount`, `extc`, `mic`, `source`, `state`]. 
GUILTY: GEN-011 :: account_code = 6124.570M AND extc = 6A9
   -> [INVALID_EXTRACT_BASE_FIELD_TYPE] Can't extract a value from "6124". Need a complex type [STRUCT, ARRAY, MAP] but got "INT". SQLSTATE: 42000
GUILTY: GEN-012 :: account_code = 1220.121 OR account_code = 1220.147
   -> [CAST_INVALID_INPUT] The value '6232.257M' of the type "STRING" cannot be cast to "DOUBLE" because it is malformed. Correct the value as per the syntax, or change its target type. Use `try_cast` to to
GUILTY: GEN-013 :: account_code LIKE 4010% AND final_description NOT LIKE %freight charges%
   -> 
GUILTY: GEN-016 :: mic_cln LIKE SEQ%
   -> 
GUILTY: GEN-017 :: mic_cln LIKE NEQ%
   -> 
GUILTY: GEN-018 :: mic_cln LIKE TOWER%
   -> 
GUILTY: GEN-019 :: mic_cln LIKE ANT% AND mic_cln LIKE %K
   -> 
GUILTY: GEN-020 :: mic_cln LIKE EFI% AND extc = 450
   -> 
GUILTY: GEN-021 :: mic_cln LIKE CEQ%
   -> 
GUILTY: GEN-022 :: extc = 450 AND account_code = 2003.85C
   -> [INVALID_EXTRACT_BASE_FIELD_TYPE] Can't extract a value from "2003". Need a complex type [STRUCT, ARRAY, MAP] but got "INT". SQLSTATE: 42000
GUILTY: GEN-023 :: extc = 460 AND account_code = 2003.85C
   -> [INVALID_EXTRACT_BASE_FIELD_TYPE] Can't extract a value from "2003". Need a complex type [STRUCT, ARRAY, MAP] but got "INT". SQLSTATE: 42000
GUILTY: GEN-024 :: extc LIKE 894%
   -> 
GUILTY: GEN-025 :: account_code LIKE 1130%
   -> 
GUILTY: GEN-026 :: vendor_name = IRON MOUNTAIN
   -> [UNRESOLVED_COLUMN.WITH_SUGGESTION] A column, variable, or function parameter with name `IRON` cannot be resolved. Did you mean one of the following? [`mic`, `extc`, `state`, `amount`, `source`]. SQLS
GUILTY: GEN-029 :: final_description LIKE base Service% AND account_code = 6123.91
   -> 
GUILTY: GEN-030 :: final_description = fiber AND account_code = 6114.1
   -> [UNRESOLVED_COLUMN.WITH_SUGGESTION] A column, variable, or function parameter with name `fiber` cannot be resolved. Did you mean one of the following? [`mic`, `extc`, `state`, `driverid`, `source`]. S
GUILTY: GEN-031 :: final_description LIKE %ceeot% AND extc = 455
   -> 
GUILTY: GEN-032 :: final_description LIKE %ceeot% AND extc = 465
   -> 
GUILTY: GEN-033 :: final_description LIKE %ceeot% AND extc = 520
   -> 
GUILTY: GEN-034 :: vendor_name = DIVERSIFIED WIRE & CABLE INC
   -> 
GUILTY: GEN-035 :: vendor_name = CISCO SYSTEMS CAPITAL CORP>9I
   -> 
GUILTY: GEN-036 :: vendor_name = TEKSYSTEMS INC>9M
   -> 
GUILTY: GEN-038 :: vendor_name = JK COMMUNICATIONS & CONSTRUCTION>9L
   -> 
GUILTY: GEN-039 :: vendor_name = AMERICAN SAFETY UTILITY CORP>9B
   -> 
GUILTY: GEN-040 :: vendor_name = IMAGE SOLUTIONS APPAREL INC
   -> 
GUILTY: GEN-041 :: vendor_name = SAF T GARD INTERNATIONAL INC
   -> 
GUILTY: GEN-042 :: vendor_name = SOUTHLAND ENTERPRISES>2
   -> 
GUILTY: GEN-043 :: vendor_name = STANLEY CONVERGENT
   -> [UNRESOLVED_COLUMN.WITH_SUGGESTION] A column, variable, or function parameter with name `STANLEY` cannot be resolved. Did you mean one of the following? [`extc`, `mic`, `state`, `amount`, `source`]. S
GUILTY: GEN-045 :: vendor_name LIKE CANTEEN ONE%
   -> 
GUILTY: GEN-046 :: vendor_name LIKE ARAMARK REFRESHMENT SERVICES%
   -> 
GUILTY: GEN-048 :: account_code = 6114.1 AND final_description LIKE %insulated gloves%
   -> 
GUILTY: GEN-049 :: extc = 520 AND account_code LIKE %M
   -> 
GUILTY: PV-002 :: vendor_name = AMERICAN SAFETY UTILITY CORP AND extc = 9B
   -> 
GUILTY: PV-003 :: vendor_name = ALLIED UNIVERSAL AND extc = 9I
   -> 
GUILTY: PV-007 :: vendor_name = LINCOLN CONTROLS INC AND extc = 1
   -> 
GUILTY: PV-008 :: vendor_name = LOOMIS FARGO & CO AND extc = 9M
   -> 
GUILTY: PV-011 :: vendor_name = THE MORNING CONSULT LLC AND extc = 9I
   -> 
GUILTY: PV-019 :: vendor_name = VMWARE INC AND extc = 9I
   -> 
GUILTY: PV-021 :: vendor_name = SAIA LOGISTICS SERVICES LLC AND extc = 9I
   -> 
GUILTY: PV-031 :: vendor_name = MATRIX RESOURCES INC AND extc = 9I
   -> 
GUILTY: PV-034 :: vendor_name = SIENA ENGINEERING GROUP INC AND extc = 9L
   -> 
GUILTY: PV-035 :: vendor_name = PARALLEL TOWERS III LLC AND extc = 1
   -> 
GUILTY: PV-036 :: vendor_name = PARALLEL TOWERS III LLC AND extc = 1
   -> 

   UPDATE `31500_atims_dev`.atims_taxability.classification_rules
   SET match_expression = "account_code = '2003.45C'"   -- or whatever the intent was
   WHERE rule_id = '<guilty_id>';

