-- Migration: product clusters + clustering support
-- Run ONCE against the prixlo DB

-- 1. Clusters table
CREATE TABLE IF NOT EXISTS product_clusters (
  id            SERIAL PRIMARY KEY,
  canonical_name  TEXT NOT NULL,
  canonical_brand TEXT,
  name_key        TEXT NOT NULL,   -- normalized sort-key used for grouping
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clusters_name_key ON product_clusters(name_key);

-- 2. FK on prices
ALTER TABLE prices ADD COLUMN IF NOT EXISTS cluster_id INT REFERENCES product_clusters(id);
CREATE INDEX IF NOT EXISTS idx_prices_cluster ON prices(cluster_id) WHERE cluster_id IS NOT NULL;

-- 3. Rebuild views to include cluster columns
DROP VIEW IF EXISTS v_active_prices;
DROP VIEW IF EXISTS v_prices;

CREATE VIEW v_prices AS
SELECT
  p.id,
  p.name,
  p.brand,
  p.price,
  p.image_url,
  p.cluster_id,
  COALESCE(c.canonical_name,  p.name)  AS canonical_name,
  COALESCE(c.canonical_brand, p.brand) AS canonical_brand,
  m.name   AS merchant,
  m.slug   AS merchant_slug,
  f.region,
  f.valid_from,
  f.valid_to
FROM prices p
JOIN  flyers           f ON f.id = p.flyer_id
JOIN  merchants        m ON m.id = f.merchant_id
LEFT JOIN product_clusters c ON p.cluster_id = c.id;

CREATE VIEW v_active_prices AS
SELECT * FROM v_prices
WHERE valid_to >= CURRENT_DATE;

-- 4. Verify
SELECT 'product_clusters created' AS status;
SELECT COUNT(*) AS prices_total FROM prices;
SELECT column_name FROM information_schema.columns
  WHERE table_name = 'prices' AND column_name = 'cluster_id';
