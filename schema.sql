-- schema.sql
-- Schéma PostgreSQL — agrégateur de promos épicerie Canada
-- Usage: psql -d epicerie -f schema.sql

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── Marchands ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchants (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(255) NOT NULL UNIQUE,
    slug  VARCHAR(255) NOT NULL UNIQUE
);

-- ─── Circulaires ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flyers (
    id          BIGINT PRIMARY KEY,   -- id Flipp
    merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    region      VARCHAR(100),
    valid_from  DATE,
    valid_to    DATE,
    fetched_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Items / Prix ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prices (
    id         BIGINT PRIMARY KEY,   -- item_id Flipp
    flyer_id   BIGINT NOT NULL REFERENCES flyers(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    brand      VARCHAR(255),
    price      NUMERIC(10, 2),
    image_url  TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wrapper IMMUTABLE pour unaccent (requis pour index GIN)
CREATE OR REPLACE FUNCTION unaccent_immutable(text)
    RETURNS text LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE AS
$$ SELECT public.unaccent($1) $$;

-- ─── Index full-text search (bilingue, sans accents) ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_prices_fts
    ON prices USING GIN (to_tsvector('simple', unaccent_immutable(name)));

-- Index trigramme pour recherche fuzzy / ILIKE
CREATE INDEX IF NOT EXISTS idx_prices_trgm
    ON prices USING GIN (name gin_trgm_ops);

-- Index prix pour tri
CREATE INDEX IF NOT EXISTS idx_prices_price
    ON prices(price) WHERE price IS NOT NULL;

-- Index flyer pour les JOINs
CREATE INDEX IF NOT EXISTS idx_prices_flyer
    ON prices(flyer_id);

-- Index marchands / dates pour filtrer circulaires actifs
CREATE INDEX IF NOT EXISTS idx_flyers_merchant
    ON flyers(merchant_id);

CREATE INDEX IF NOT EXISTS idx_flyers_valid_to
    ON flyers(valid_to);

-- ─── Vue : prix enrichis ──────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_prices AS
SELECT
    p.id,
    p.name,
    p.brand,
    p.price,
    p.image_url,
    m.name       AS merchant,
    m.slug       AS merchant_slug,
    f.region,
    f.valid_from,
    f.valid_to
FROM  prices    p
JOIN  flyers    f ON f.id = p.flyer_id
JOIN  merchants m ON m.id = f.merchant_id;

-- ─── Vue : circulaires actifs aujourd'hui ────────────────────────────────────
CREATE OR REPLACE VIEW v_active_prices AS
SELECT * FROM v_prices
WHERE valid_to >= CURRENT_DATE;
