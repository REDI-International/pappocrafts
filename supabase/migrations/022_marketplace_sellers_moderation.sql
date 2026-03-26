-- Seller accounts (Roma entrepreneurs), product moderation, service provider fields

ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('superadmin', 'admin', 'user', 'seller'));

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS base_country TEXT
  CHECK (base_country IS NULL OR base_country IN ('North Macedonia', 'Serbia', 'Albania'));
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS business_name TEXT NOT NULL DEFAULT '';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS business_slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_business_slug
  ON admin_users (business_slug)
  WHERE business_slug IS NOT NULL AND length(trim(business_slug)) > 0;

ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES admin_users(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS business_name TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS business_slug TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE products ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE products ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

UPDATE products SET business_name = artisan WHERE trim(business_name) = '';

ALTER TABLE products ALTER COLUMN approval_status SET DEFAULT 'pending';

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_approval_status_check;
ALTER TABLE products ADD CONSTRAINT products_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_approval ON products(approval_status);
CREATE INDEX IF NOT EXISTS idx_products_business_slug ON products(business_slug) WHERE length(trim(business_slug)) > 0;

ALTER TABLE services ADD COLUMN IF NOT EXISTS provider_name TEXT NOT NULL DEFAULT '';
ALTER TABLE services ADD COLUMN IF NOT EXISTS summary TEXT NOT NULL DEFAULT '';
ALTER TABLE services ADD COLUMN IF NOT EXISTS years_experience TEXT NOT NULL DEFAULT '';
ALTER TABLE services ADD COLUMN IF NOT EXISTS languages_spoken TEXT NOT NULL DEFAULT '';
ALTER TABLE services ADD COLUMN IF NOT EXISTS booking_calendar_url TEXT NOT NULL DEFAULT '';
ALTER TABLE services ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES admin_users(id) ON DELETE SET NULL;

UPDATE services SET provider_name = name WHERE trim(provider_name) = '';
UPDATE services SET summary = description WHERE trim(summary) = '' AND trim(description) <> '';
