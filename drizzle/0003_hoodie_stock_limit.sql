-- The added L hoodie has one unit. Keep previously applied triggers unchanged.
CREATE TRIGGER receipts_hoodie_stock_limit BEFORE INSERT ON receipts
WHEN NEW.product = 'hoodie-l'
 AND (SELECT COUNT(*) FROM receipts WHERE product = 'hoodie-l') >= 1
BEGIN
 SELECT RAISE(ABORT, 'stock_limit');
END;
