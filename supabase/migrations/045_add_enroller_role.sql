-- Add 'enroller' role for REDI team members who can register (enroll) Roma
-- entrepreneurs but are NOT permitted to approve product or service listings.

-- Extend the role constraint to include the new value.
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('superadmin', 'admin', 'user', 'seller', 'enroller'));

-- REDI team enroller accounts
-- Default password: Welcome2REDI*
-- SHA-256('Welcome2REDI*') = 06e97d38201662749b98fae635b26fb07c1cfc023705fa97c809ac8a665c6ea7
INSERT INTO admin_users (email, password_hash, role, name) VALUES
  ('musa@redi-ngo.eu',  '06e97d38201662749b98fae635b26fb07c1cfc023705fa97c809ac8a665c6ea7', 'enroller', 'Musa'),
  ('omer@redi-ngo.eu',  '06e97d38201662749b98fae635b26fb07c1cfc023705fa97c809ac8a665c6ea7', 'enroller', 'Omer'),
  ('hadis@redi-ngo.eu', '06e97d38201662749b98fae635b26fb07c1cfc023705fa97c809ac8a665c6ea7', 'enroller', 'Hadis')
ON CONFLICT (email) DO NOTHING;
