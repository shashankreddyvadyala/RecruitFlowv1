SELECT 't35_qa' tbl, count(*) n FROM `31500_atims_dev`.atims_taxability.t35_qa
UNION ALL SELECT 't36_reroute', count(*) FROM `31500_atims_dev`.atims_taxability.t36_reroute
UNION ALL SELECT 'non_norad_predictions', count(*) FROM `31500_atims_dev`.atims_taxability.non_norad_predictions
ORDER BY 1;

SELECT match_type, count(*) n
FROM `31500_atims_dev`.atims_taxability.non_norad_predictions
GROUP BY match_type ORDER BY n DESC;


SELECT review_priority, count(*) n
FROM `31500_atims_dev`.atims_taxability.non_norad_predictions
GROUP BY review_priority ORDER BY 1;


SELECT invoice_id, vendor_name, state, final_category, match_type,
       taxability, Reverse_UseTax, review_priority, audit_ready
FROM `31500_atims_dev`.atims_taxability.non_norad_predictions
LIMIT 15;

