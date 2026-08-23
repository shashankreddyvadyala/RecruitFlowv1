expr_rules = (rules.filter(col("rule_type") == "expression")
                   .select("rule_id", "match_expression").collect())
print(f"testing {len(expr_rules)} live expression rules over the month...")
for er in expr_rules:
    me = er["match_expression"]
    if not me: continue
    try:
        src.where(F.expr(me)).count()
    except Exception as e:
        print(f"GUILTY: {er['rule_id']} :: {me}")
        print("   ->", str(e).split(chr(10))[0][:200])

   UPDATE `31500_atims_dev`.atims_taxability.classification_rules
   SET match_expression = "account_code = '2003.45C'"   -- or whatever the intent was
   WHERE rule_id = '<guilty_id>';

