-- Donor visibility and temporary direct-order contact fields for entrepreneur profiles.
ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT;

UPDATE public.admin_users
SET contact_email = email
WHERE role = 'seller'
  AND (contact_email IS NULL OR length(trim(contact_email)) = 0);

ALTER TABLE public.admin_users
  DROP CONSTRAINT IF EXISTS admin_users_gender_check;

ALTER TABLE public.admin_users
  ADD CONSTRAINT admin_users_gender_check
  CHECK (gender IS NULL OR gender IN ('M', 'F'));

CREATE INDEX IF NOT EXISTS idx_admin_users_seller_gender
  ON public.admin_users (gender)
  WHERE role = 'seller';

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS seller_gender TEXT;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_seller_gender_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_seller_gender_check
  CHECK (seller_gender IS NULL OR seller_gender IN ('M', 'F'));

UPDATE public.products p
SET contact_email = COALESCE(NULLIF(trim(u.contact_email), ''), u.email),
    seller_gender = u.gender
FROM public.admin_users u
WHERE p.seller_id = u.id
  AND (p.contact_email IS NULL OR length(trim(p.contact_email)) = 0);

-- Product orders use email during the current operational phase; services continue using phone.
DROP FUNCTION IF EXISTS public.increment_listing_contact_reveal(text, text);

CREATE OR REPLACE FUNCTION public.increment_listing_contact_reveal(p_kind text, p_id text)
RETURNS TABLE(out_contact text, out_contact_type text, out_count int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(trim(p_kind)) = 'product' THEN
    RETURN QUERY
    UPDATE public.products p
    SET contact_reveal_count = p.contact_reveal_count + 1
    FROM public.admin_users u
    WHERE p.id = p_id
      AND p.approval_status = 'approved'
      AND p.seller_id = u.id
      AND length(trim(COALESCE(u.contact_email, p.contact_email, u.email))) > 0
    RETURNING trim(COALESCE(u.contact_email, p.contact_email, u.email)), 'email'::text, p.contact_reveal_count;

    IF NOT FOUND THEN
      RETURN QUERY
      UPDATE public.products p
      SET contact_reveal_count = p.contact_reveal_count + 1
      WHERE p.id = p_id
        AND p.approval_status = 'approved'
        AND length(trim(COALESCE(p.contact_email, p.submitter_email, ''))) > 0
      RETURNING trim(COALESCE(p.contact_email, p.submitter_email, '')), 'email'::text, p.contact_reveal_count;
    END IF;
  ELSIF lower(trim(p_kind)) = 'service' THEN
    RETURN QUERY
    UPDATE public.services s
    SET contact_reveal_count = s.contact_reveal_count + 1
    WHERE s.id = p_id
      AND length(trim(COALESCE(s.phone, ''))) > 0
    RETURNING trim(s.phone), 'phone'::text, s.contact_reveal_count;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_listing_contact_reveal(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_listing_contact_reveal(text, text) TO service_role;
