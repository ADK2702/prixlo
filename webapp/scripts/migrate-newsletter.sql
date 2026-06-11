-- =============================================================================
-- Phase 8 — Newsletter subscribers table
-- Apply on Supabase: Dashboard → SQL Editor → Run
-- =============================================================================

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id              BIGSERIAL     PRIMARY KEY,
  email           VARCHAR(254)  NOT NULL UNIQUE,
  locale          VARCHAR(10)   NOT NULL DEFAULT 'fr-CA',
  source          TEXT,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  subscribed_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email    ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active   ON newsletter_subscribers(is_active);
CREATE INDEX IF NOT EXISTS idx_newsletter_locale   ON newsletter_subscribers(locale);

-- Row Level Security: allow anonymous inserts (signup), block reads
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow signup (INSERT) without authentication
CREATE POLICY "allow_anonymous_signup"
  ON newsletter_subscribers
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow unsubscribe (UPDATE is_active only) without authentication
CREATE POLICY "allow_anonymous_unsubscribe"
  ON newsletter_subscribers
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (is_active = false);

-- Block reads for anon (emails are private)
-- Only service_role can read (used by email sending service)

COMMENT ON TABLE newsletter_subscribers IS
  'Prixlo newsletter subscribers — weekly flyer deals digest';
