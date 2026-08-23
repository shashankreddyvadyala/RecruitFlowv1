
RULES schema: struct<rule_id:string,rule_type:string,priority:int,priority_tier:string,active:boolean,needs_review:string,effective_from:date,effective_to:date,source_sheet:string,source_rule:string,extc:string,mic_cln:string,account_code:string,account_code_from:string,account_code_to:string,vendor_id:string,vendor_name:string,keyword:string,match_expression:string,category:string,confidence:double,description:string,created_by:string,created_at:timestamp,updated_at:timestamp>
SRC keys    : struct<account_code:string,extc:string,mic_cln:string,invoice_id:double,inv_line_number:string>
UPDATED CODE CHECK — coercion loop present: True
OK   c_exact: 6,023
OK   c_range: 0
OK   c_vendor: 2,610
OK   c_keyword: 34,454
BOOM candidates(all): [CAST_INVALID_INPUT] The value '2003.45C' of the type "STRING" cannot be cast to "DOUBLE" because it is malformed. Correct the value as per the syntax, or change its target type. Use `try_cast` to tolerate malformed input and return NULL instead. SQLSTATE: 22018  JVM stacktrace: org.apache.spark.Spa
