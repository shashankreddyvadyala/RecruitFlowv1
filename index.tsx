REFRESH TABLE `31500_atims_dev`.atims_taxability.non_norad_predictions;
SELECT * FROM `31500_atims_dev`.atims_taxability.non_norad_predictions LIMIT 15;

-- 1. Are the rules actually loaded and active, by type?
SELECT rule_type, count(*) n, sum(CASE WHEN active THEN 1 ELSE 0 END) active_n
FROM `31500_atims_dev`.atims_taxability.classification_rules
GROUP BY rule_type ORDER BY n DESC;

-- 2. What categories did the LLM assign? (tells us what this data actually is)
SELECT final_category, count(*) n
FROM `31500_atims_dev`.atims_taxability.non_norad_predictions
GROUP BY final_category ORDER BY n DESC LIMIT 20;

-- 3. What account_code / extc combos dominate the input?
SELECT account_code, extc, count(*) n
FROM `31500_atims_dev`.atims_taxability.prediction_ready
WHERE date_format(to_date(accounting_date),'yyyy-MM')='2022-12'
GROUP BY account_code, extc ORDER BY n DESC LIMIT 15;
