SELECT invoice_id, inv_line_number, final_description,
       final_category, match_type, ensemble_confidence,
       model_second_opinion
FROM `31500_atims_dev`.atims_taxability.non_norad_predictions
LIMIT 50;
