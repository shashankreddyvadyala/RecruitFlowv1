SELECT 't35_qa' tbl, count(*) n FROM `31500_atims_dev`.atims_taxability.t35_qa
UNION ALL SELECT 't36_reroute', count(*) FROM `31500_atims_dev`.atims_taxability.t36_reroute
UNION ALL SELECT 'non_norad_predictions', count(*) FROM `31500_atims_dev`.atims_taxability.non_norad_predictions
ORDER BY 1;

tbl	n
non_norad_predictions	4688
t35_qa	4688
t36_reroute	4688

SELECT match_type, count(*) n
FROM `31500_atims_dev`.atims_taxability.non_norad_predictions
GROUP BY match_type ORDER BY n DESC;

match_type	n
ml	4687
det	1


SELECT review_priority, count(*) n
FROM `31500_atims_dev`.atims_taxability.non_norad_predictions
GROUP BY review_priority ORDER BY 1;

review_priority	n
LOW	4651
MED	37

SELECT invoice_id, vendor_name, state, final_category, match_type,
       taxability, Reverse_UseTax, review_priority, audit_ready
FROM `31500_atims_dev`.atims_taxability.non_norad_predictions
LIMIT 15;

IllegalArgumentException: Cannot find column index for attribute 'invoice_id#1214181' in: Map(Reverse_UseTax#1214190 -> 2, review_priority#1214201 -> 5, final_category#1214187 -> 0, taxability#1214188 -> 1, audit_ready#1214197 -> 4, match_type#1214194 -> 3)
=== EXPRESSION ===

