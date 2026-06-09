-- Fix v_prices and v_active_prices to use correct JOIN path
-- prices → flyers → merchants (not prices → merchants directly)

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

-- Verify
SELECT COUNT(*) AS active_prices FROM v_active_prices;
SELECT COUNT(*) AS clusters FROM product_clusters;
SELECT COUNT(*) AS prices_with_cluster FROM prices WHERE cluster_id IS NOT NULL;
