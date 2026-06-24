sqlSELECT date_format(to_date(ACCOUNTING_DATE),'yyyy-MM') m, count(*)
FROM `31500_atims_dev`.atims_taxability.prediction_ready
GROUP BY 1 ORDER BY 1;

SELECT 'prediction_ready' tbl, count(*) n FROM `31500_atims_dev`.atims_taxability.prediction_ready
UNION ALL SELECT 't31_rules_matched', count(*) FROM `31500_atims_dev`.atims_taxability.t31_rules_matched
UNION ALL SELECT 't31_rag_matched',   count(*) FROM `31500_atims_dev`.atims_taxability.t31_rag_matched
UNION ALL SELECT 't31_unmatched',     count(*) FROM `31500_atims_dev`.atims_taxability.t31_unmatched
UNION ALL SELECT 't32_classified',    count(*) FROM `31500_atims_dev`.atims_taxability.t32_classified
UNION ALL SELECT 't33_tax_lookup',    count(*) FROM `31500_atims_dev`.atims_taxability.t33_tax_lookup
UNION ALL SELECT 't33b_use_tax',      count(*) FROM `31500_atims_dev`.atims_taxability.t33b_use_tax
UNION ALL SELECT 't34_tax_writer',    count(*) FROM `31500_atims_dev`.atims_taxability.t34_tax_writer
UNION ALL SELECT 't35_qa',            count(*) FROM `31500_atims_dev`.atims_taxability.t35_qa
UNION ALL SELECT 't36_reroute',       count(*) FROM `31500_atims_dev`.atims_taxability.t36_reroute
UNION ALL SELECT 'non_norad_predictions', count(*) FROM `31500_atims_dev`.atims_taxability.non_norad_predictions
ORDER BY 1;
