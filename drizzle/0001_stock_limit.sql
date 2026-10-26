-- Match the finite stock counts in lib/products.ts.
-- A trigger keeps multi-product saves atomic: insufficient stock rolls back the batch.
CREATE TRIGGER receipts_stock_limit BEFORE INSERT ON receipts
WHEN (SELECT COUNT(*) FROM receipts WHERE product = NEW.product) >=
  CASE NEW.product
    WHEN 'duck-n8n' THEN 8 WHEN 'duck-ionos' THEN 2
    WHEN 'computer' THEN 4 WHEN 'socks' THEN 3
    WHEN 'bag-n8n' THEN 11 WHEN 'bag-ionos' THEN 1
    WHEN 'cap-n8n' THEN 3 WHEN 'cap-sendit' THEN 2 WHEN 'cap-space' THEN 2
    WHEN 'tee-black-l' THEN 2 WHEN 'tee-black-m' THEN 2 WHEN 'tee-white-l' THEN 1
    ELSE NULL
  END
BEGIN
  SELECT RAISE(ABORT, 'stock_limit');
END;
