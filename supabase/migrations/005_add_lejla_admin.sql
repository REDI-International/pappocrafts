-- Add Lejla admin account
-- lejla@redi-ngo.eu / admin123
-- SHA-256 of 'admin123' = 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
INSERT INTO admin_users (email, password_hash, role, name) VALUES
('lejla@redi-ngo.eu', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin', 'Lejla')
ON CONFLICT (email) DO NOTHING;
