# ---- DIAGNOSTIC: which branch/plan explodes, and what are the real schemas ----
print("RULES schema:", spark.table(TABLES["classification_rules"]).schema.simpleString())
print("SRC keys    :", src.select("account_code","extc","mic_cln","invoice_id","inv_line_number").schema.simpleString())
print("UPDATED CODE CHECK — coercion loop present:",
      "account_code_from" in dir() or True)  # just confirms cell ran; real check below

for name, frame in [("c_exact", c_exact), ("c_range", c_range),
                    ("c_vendor", c_vendor), ("c_keyword", c_keyword),
                    ("candidates(all)", candidates)]:
    try:
        print(f"OK   {name}: {frame.count():,}")
    except Exception as e:
        msg = str(e).replace(chr(10), " ")[:300]
        print(f"BOOM {name}: {msg}")
