SELECT count(*) FROM `31500_atims_dev`.atims_taxability.prediction_ready
WHERE date_format(accounting_date,'yyyy-MM')='2022-12';            -- what 3.1 does now

SELECT count(*) FROM `31500_atims_dev`.atims_taxability.prediction_ready
WHERE date_format(to_date(accounting_date),'yyyy-MM')='2022-12';   -- with to_date
