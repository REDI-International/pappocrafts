-- Site settings table for CMS-editable logo and text content
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Service role full access site_settings" ON site_settings FOR ALL USING (true) WITH CHECK (true);

-- Seed default settings
INSERT INTO site_settings (key, value) VALUES
  ('logo_url', '/pappocrafts-logo.png'),
  ('hero_badge', 'Western Balkans Marketplace'),
  ('hero_title1', 'Handcrafted with'),
  ('hero_title2', 'Heart & Heritage'),
  ('hero_description', 'Discover authentic handmade products and local services from Roma entrepreneurs across the Western Balkans. Every purchase supports livelihoods and preserves cultural traditions.'),
  ('footer_description', 'Authentic handmade products and services from Roma entrepreneurs across the Western Balkans.'),
  ('mission_badge', 'Our Mission'),
  ('mission_title', 'Empowering Roma Artisans Across the Balkans'),
  ('mission_desc1', 'PappoCrafts connects talented Roma artisans and service providers with customers who value authenticity, quality, and social impact. Every purchase directly supports Roma entrepreneurs and their families.'),
  ('mission_desc2', 'We believe that economic empowerment is the most sustainable path to social inclusion. By providing a platform for Roma entrepreneurs, we help preserve centuries-old crafting traditions while creating new opportunities.')
ON CONFLICT (key) DO NOTHING;
