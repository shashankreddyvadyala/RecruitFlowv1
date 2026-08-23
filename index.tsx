SELECT
  date_format(to_date(ACCOUNTING_DATE), 'yyyy-MM') AS acct_month,
  date_format(to_date(INVOICE_DATE),    'yyyy-MM') AS inv_month,
  count(*) AS n
FROM `31500_atims_dev`.atims_taxability.prediction_ready
GROUP BY 1, 2
ORDER BY acct_month DESC NULLS LAST, inv_month DESC
LIMIT 25;
