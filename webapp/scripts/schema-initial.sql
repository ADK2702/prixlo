-- =============================================================================
-- Prixlo — Initial DB Schema
-- Run ONCE before all migrations: Dashboard → SQL Editor → Run
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.unaccent_immutable(text)
  RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
  $$ SELECT unaccent($1) $$;

-- Product clusters (group same product across merchants)
CREATE TABLE IF NOT EXISTS product_clusters (
  id              BIGSERIAL    PRIMARY KEY,
  canonical_name  VARCHAR(255) NOT NULL,
  canonical_brand VARCHAR(120),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Merchants
CREATE TABLE IF NOT EXISTS merchants (
  id              BIGSERIAL    PRIMARY KEY,
  name            VARCHAR(120) NOT NULL,
  slug            VARCHAR(80)  UNIQUE,
  region          VARCHAR(40),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Products (normalized product catalog)
CREATE TABLE IF NOT EXISTS products (
  id              BIGSERIAL    PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  category        VARCHAR(80),
  image_url       TEXT,
  cluster_id      BIGINT       REFERENCES product_clusters(id),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(
  to_tsvector('simple', unaccent_immutable(name))
);

-- Prices (one row per product × merchant × flyer cycle)
CREATE TABLE IF NOT EXISTS prices (
  id              BIGSERIAL    PRIMARY KEY,
  product_id      BIGINT       NOT NULL REFERENCES products(id)  ON DELETE CASCADE,
  merchant_id     BIGINT       NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  regular_price   NUMERIC(10,2),
  sale_price      NUMERIC(10,2),
  unit            VARCHAR(40),
  unit_price      NUMERIC(10,2),
  valid_from      DATE         NOT NULL DEFAULT CURRENT_DATE,
  valid_to        DATE         NOT NULL,
  source_url      TEXT,
  cluster_id      BIGINT       REFERENCES product_clusters(id),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prices_valid_to   ON prices(valid_to);
CREATE INDEX IF NOT EXISTS idx_prices_valid_from ON prices(valid_from);
CREATE INDEX IF NOT EXISTS idx_prices_product    ON prices(product_id);
CREATE INDEX IF NOT EXISTS idx_prices_merchant   ON prices(merchant_id);

-- Flyers (weekly circulars — optional, for future use)
CREATE TABLE IF NOT EXISTS flyers (
  id              BIGSERIAL    PRIMARY KEY,
  merchant_id     BIGINT       NOT NULL REFERENCES merchants(id),
  valid_from      DATE,
  valid_to        DATE,
  flyer_url       TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flyers_valid_to ON flyers(valid_to);

-- v_active_prices view — includes both normalized and backward-compat columns
-- so existing API routes (search, cluster) keep working after migration
CREATE OR REPLACE VIEW v_active_prices AS
SELECT
  p.id,
  p.product_id,
  p.merchant_id,
  pr.name                                     AS product_name,
  pr.name                                     AS name,            -- compat
  pr.category,
  pr.image_url,
  COALESCE(p.sale_price, p.regular_price)     AS price,           -- compat
  m.name                                      AS merchant_name,
  m.name                                      AS merchant,        -- compat
  m.slug                                      AS merchant_slug,   -- compat
  m.region                                    AS region,          -- compat
  p.regular_price,
  p.sale_price,
  COALESCE(p.sale_price, p.regular_price)     AS effective_price,
  p.unit,
  p.unit_price,
  p.valid_from,
  p.valid_to,
  p.source_url,
  p.cluster_id,
  p.created_at
FROM prices p
JOIN products pr ON pr.id = p.product_id
JOIN merchants m  ON m.id  = p.merchant_id
WHERE p.valid_to  >= CURRENT_DATE
  AND p.valid_from <= CURRENT_DATE;

GRANT SELECT ON v_active_prices   TO anon;
GRANT SELECT ON products          TO anon;
GRANT SELECT ON merchants         TO anon;
GRANT SELECT ON product_clusters  TO anon;
GRANT SELECT ON flyers            TO anon;
