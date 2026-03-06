-- Add 'user' to the allowed roles for admin_users
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check CHECK (role IN ('superadmin', 'admin', 'user'));

-- Seed the demo user account
-- user@papposhop.org / PappoUser2026!
INSERT INTO admin_users (email, password_hash, role, name) VALUES
  ('user@papposhop.org', 'ee1d895e7608feb60227457b5ac57423418e38ce275bc703e42a6c38a10c2dd2', 'user', 'Demo User')
ON CONFLICT (email) DO NOTHING;
