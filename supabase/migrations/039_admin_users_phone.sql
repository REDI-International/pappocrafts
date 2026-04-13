-- Add required seller phone on admin_users and backfill existing rows.
ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';

UPDATE public.admin_users
SET phone = '+38976805651'
WHERE role = 'seller' AND btrim(phone) = '';
