-- Optional seller profile fields shown on public listing pages.
ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS biography TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS logo_url TEXT NOT NULL DEFAULT '';
