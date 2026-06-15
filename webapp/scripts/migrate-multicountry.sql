-- =============================================================================
-- Phase 7 — Multi-country DB schema migration
-- Apply once on Supabase: Dashboard → SQL Editor → Run
-- =============================================================================

-- 1. Add country column to merchants table
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS country        CHAR(2)      NOT NULL DEFAULT 'CA',
  ADD COLUMN IF NOT EXISTS currency       VARCHAR(3)   NOT NULL DEFAULT 'CAD',
  ADD COLUMN IF NOT EXISTS locale         VARCHAR(10)  NOT NULL DEFAULT 'fr-CA',
  ADD COLUMN IF NOT EXISTS website_url    TEXT,
  ADD COLUMN IF NOT EXISTS logo_url       TEXT;

-- 2. Add country column to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS country        CHAR(2)      NOT NULL DEFAULT 'CA',
  ADD COLUMN IF NOT EXISTS barcode        VARCHAR(20),
  ADD COLUMN IF NOT EXISTS brand          VARCHAR(120);

CREATE INDEX IF NOT EXISTS idx_products_country ON products(country);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

-- 3. Add country to prices table for fast filtering without joins
ALTER TABLE prices
  ADD COLUMN IF NOT EXISTS country        CHAR(2)      NOT NULL DEFAULT 'CA';

CREATE INDEX IF NOT EXISTS idx_prices_country ON prices(country);

-- 4. Create a countries reference table
CREATE TABLE IF NOT EXISTS countries (
  code          CHAR(2)       PRIMARY KEY,
  name_fr       VARCHAR(80)   NOT NULL,
  name_en       VARCHAR(80)   NOT NULL,
  currency      CHAR(3)       NOT NULL,
  currency_sym  VARCHAR(4)    NOT NULL,
  locale        VARCHAR(10)   NOT NULL,
  flag_emoji    VARCHAR(4)    NOT NULL,
  is_supported  BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

INSERT INTO countries (code, name_fr, name_en, currency, currency_sym, locale, flag_emoji, is_supported)
VALUES
  ('CA', 'Canada',           'Canada',          'CAD', '$',   'fr-CA', '🇨🇦', TRUE),
  ('US', 'États-Unis',       'United States',   'USD', '$',   'en-US', '🇺🇸', FALSE),
  ('FR', 'France',           'France',          'EUR', '€',   'fr-FR', '🇫🇷', FALSE),
  ('BE', 'Belgique',         'Belgium',         'EUR', '€',   'fr-BE', '🇧🇪', FALSE),
  ('CH', 'Suisse',           'Switzerland',     'CHF', 'CHF', 'fr-CH', '🇨🇭', FALSE),
  ('GB', 'Royaume-Uni',      'United Kingdom',  'GBP', '£',   'en-GB', '🇬🇧', FALSE),
  ('DE', 'Allemagne',        'Germany',         'EUR', '€',   'de-DE', '🇩🇪', FALSE),
  ('AU', 'Australie',        'Australia',       'AUD', '$',   'en-AU', '🇦🇺', FALSE),
  ('MX', 'Mexique',          'Mexico',          'MXN', '$',   'es-MX', '🇲🇽', FALSE),
  ('BR', 'Brésil',           'Brazil',          'BRL', 'R$',  'pt-BR', '🇧🇷', FALSE),
  ('JP', 'Japon',            'Japan',           'JPY', '¥',   'ja-JP', '🇯🇵', FALSE),
  ('KR', 'Corée du Sud',     'South Korea',     'KRW', '₩',   'ko-KR', '🇰🇷', FALSE)
ON CONFLICT (code) DO NOTHING;

-- 5. Update v_active_prices view to include country
-- (Drop and recreate to add country column)
DROP VIEW IF EXISTS v_active_prices;

CREATE OR REPLACE VIEW v_active_prices AS
SELECT
  p.id,
  p.product_id,
  p.merchant_id,
  pr.name                                     AS product_name,
  pr.name                                     AS name,            -- compat (search API)
  pr.category,
  pr.brand,                                                       -- compat (search API)
  pr.barcode,
  pr.image_url,                                                   -- compat (search API)
  pr.country                                  AS country,
  m.name                                      AS merchant_name,
  m.name                                      AS merchant,        -- compat (search API)
  m.slug                                      AS merchant_slug,   -- compat
  m.region                                    AS region,          -- compat
  m.locale                                    AS merchant_locale,
  m.currency                                  AS currency,
  p.regular_price,
  p.sale_price,
  COALESCE(p.sale_price, p.regular_price)     AS effective_price,
  COALESCE(p.sale_price, p.regular_price)     AS price,           -- compat (search API)
  p.unit,
  p.unit_price,
  p.valid_from,
  p.valid_to,
  p.source_url,
  p.cluster_id,
  p.created_at
FROM prices p
JOIN products pr ON pr.id = p.product_id
JOIN merchants m  ON m.id = p.merchant_id
WHERE p.valid_to >= CURRENT_DATE
  AND p.valid_from <= CURRENT_DATE;

-- 6. Grant read access (Supabase anon key)
GRANT SELECT ON v_active_prices TO anon;
GRANT SELECT ON countries TO anon;

-- Done!
-- To enable a new country: UPDATE countries SET is_supported = TRUE WHERE code = 'FR';
