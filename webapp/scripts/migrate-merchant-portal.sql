-- =============================================================================
-- Merchant Self-Submission Portal — DB Schema
-- Apply on Supabase: Dashboard → SQL Editor → Run
-- =============================================================================

-- 1. Merchant accounts (stores that submit their own promos)
CREATE TABLE IF NOT EXISTS merchant_accounts (
  id              BIGSERIAL     PRIMARY KEY,
  name            VARCHAR(120)  NOT NULL,
  country         CHAR(2)       NOT NULL DEFAULT 'CA',
  city            VARCHAR(80),
  website_url     TEXT,
  contact_email   VARCHAR(254)  NOT NULL UNIQUE,
  contact_name    VARCHAR(120),
  phone           VARCHAR(30),
  logo_url        TEXT,
  api_key         UUID          NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status          VARCHAR(20)   NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','suspended')),
  plan            VARCHAR(20)   NOT NULL DEFAULT 'free'
                  CHECK (plan IN ('free','partner','premium')),
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_accounts_country ON merchant_accounts(country);
CREATE INDEX IF NOT EXISTS idx_merchant_accounts_status  ON merchant_accounts(status);
CREATE INDEX IF NOT EXISTS idx_merchant_accounts_api_key ON merchant_accounts(api_key);

-- 2. Promo submissions (pending review)
CREATE TABLE IF NOT EXISTS merchant_submissions (
  id              BIGSERIAL     PRIMARY KEY,
  merchant_id     BIGINT        NOT NULL REFERENCES merchant_accounts(id) ON DELETE CASCADE,
  product_name    VARCHAR(255)  NOT NULL,
  category        VARCHAR(80),
  brand           VARCHAR(120),
  barcode         VARCHAR(20),
  regular_price   NUMERIC(10,2),
  sale_price      NUMERIC(10,2) NOT NULL,
  unit            VARCHAR(40),
  unit_price      NUMERIC(10,2),
  valid_from      DATE          NOT NULL DEFAULT CURRENT_DATE,
  valid_to        DATE          NOT NULL,
  image_url       TEXT,
  description     TEXT,
  country         CHAR(2)       NOT NULL DEFAULT 'CA',
  currency        CHAR(3)       NOT NULL DEFAULT 'CAD',
  -- Review
  status          VARCHAR(20)   NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','expired')),
  reviewed_by     VARCHAR(80),
  reviewed_at     TIMESTAMPTZ,
  reject_reason   TEXT,
  -- Auto-link to main tables after approval
  price_id        BIGINT        REFERENCES prices(id),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_merchant   ON merchant_submissions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status     ON merchant_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_valid_to   ON merchant_submissions(valid_to);
CREATE INDEX IF NOT EXISTS idx_submissions_country    ON merchant_submissions(country);

-- 3. Submission log (audit trail)
CREATE TABLE IF NOT EXISTS merchant_submission_log (
  id              BIGSERIAL     PRIMARY KEY,
  submission_id   BIGINT        REFERENCES merchant_submissions(id) ON DELETE CASCADE,
  action          VARCHAR(40)   NOT NULL,
  actor           VARCHAR(80),
  detail          TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 4. Row Level Security
ALTER TABLE merchant_accounts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_submissions ENABLE ROW LEVEL SECURITY;

-- Merchants can only see/insert their own data (via API key in header)
-- Admin uses service_role key (bypasses RLS)

-- Allow anonymous registration
CREATE POLICY "anon_register"
  ON merchant_accounts FOR INSERT TO anon
  WITH CHECK (status = 'pending');

-- Allow merchants to submit promos (authenticated via api_key check in app layer)
CREATE POLICY "anon_submit"
  ON merchant_submissions FOR INSERT TO anon
  WITH CHECK (true);

-- Public can read approved submissions
CREATE POLICY "public_read_approved"
  ON merchant_submissions FOR SELECT TO anon
  USING (status = 'approved' AND valid_to >= CURRENT_DATE);

-- 5. View: approved submissions ready to show publicly
CREATE OR REPLACE VIEW v_merchant_promos AS
SELECT
  ms.id,
  ma.name          AS merchant_name,
  ma.country,
  ma.logo_url      AS merchant_logo,
  ms.product_name,
  ms.category,
  ms.brand,
  ms.barcode,
  ms.regular_price,
  ms.sale_price,
  ms.unit,
  ms.unit_price,
  ms.valid_from,
  ms.valid_to,
  ms.image_url,
  ms.currency,
  ms.created_at
FROM merchant_submissions ms
JOIN merchant_accounts ma ON ma.id = ms.merchant_id
WHERE ms.status = 'approved'
  AND ms.valid_to >= CURRENT_DATE
  AND ma.status = 'approved';

GRANT SELECT ON v_merchant_promos TO anon;

COMMENT ON TABLE merchant_accounts    IS 'Grocery stores that self-submit their promos to Prixlo';
COMMENT ON TABLE merchant_submissions IS 'Promo submissions from merchants — reviewed before going live';
