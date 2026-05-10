-- Email verification for public buyer/seller self-registration.
ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_verification_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email_verification_token_hash
  ON public.admin_users (email_verification_token_hash)
  WHERE email_verification_token_hash IS NOT NULL
    AND length(trim(email_verification_token_hash)) > 0;
