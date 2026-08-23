SELECT rule_id, source_rule, match_expression
FROM `31500_atims_dev`.atims_taxability.classification_rules
WHERE rule_type = 'expression'
ORDER BY rule_id
LIMIT 10;

   UPDATE `31500_atims_dev`.atims_taxability.classification_rules
   SET match_expression = "account_code = '2003.45C'"   -- or whatever the intent was
   WHERE rule_id = '<guilty_id>';

