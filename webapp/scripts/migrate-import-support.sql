-- =============================================================================
-- Phase 8 — Import support: unique constraints for idempotent data pipeline
-- Apply once on Supabase: Dashboard → SQL Editor → Run
-- Must be applied AFTER migrate-multicountry.sql
-- =============================================================================

-- 1. Unique constraint on products.barcode
--    Allows ON CONFLICT (barcode) DO UPDATE in import_db.py
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_barcode_key' AND conrelid = 'products'::regclass
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_barcode_key UNIQUE (barcode);
  END IF;
END;
$$;

-- 2. Unique constraint on prices (product_id, merchant_id, valid_from, valid_to)
--    Prevents duplicate price rows for the same offer; allows ON CONFLICT DO NOTHING
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'prices_unique_offer' AND conrelid = 'prices'::regclass
  ) THEN
    ALTER TABLE prices
      ADD CONSTRAINT prices_unique_offer
      UNIQUE (product_id, merchant_id, valid_from, valid_to);
  END IF;
END;
$$;

-- 3. Ensure merchants.region column exists (added in earlier migrations, defensive)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS region VARCHAR(80);

-- Done!
-- After running this, use import_db.py to load CSV data into Supabase.
