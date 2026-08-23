SELECT count(*) FROM `31500_atims_dev`.atims_taxability.classification_rules
WHERE rule_type = 'expression' AND match_expression = source_rule;

   UPDATE `31500_atims_dev`.atims_taxability.classification_rules
   SET match_expression = "account_code = '2003.45C'"   -- or whatever the intent was
   WHERE rule_id = '<guilty_id>';

