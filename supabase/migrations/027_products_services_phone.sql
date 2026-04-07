-- Public listing phone for shop; mandatory on all product and service rows.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS phone TEXT;

UPDATE public.products
SET phone = CASE
  WHEN submitter_phone IS NOT NULL AND btrim(submitter_phone) <> '' THEN btrim(submitter_phone)
  ELSE '+38976805651'
END
WHERE phone IS NULL OR btrim(phone) = '';

ALTER TABLE public.products ALTER COLUMN phone SET NOT NULL;

ALTER TABLE public.services ADD COLUMN IF NOT EXISTS phone TEXT;

UPDATE public.services
SET phone = '+38976805651'
WHERE phone IS NULL OR btrim(phone) = '';

ALTER TABLE public.services ALTER COLUMN phone SET NOT NULL;

-- Service listing requests: phone required for new submissions
UPDATE public.service_listing_requests
SET contact_phone = '+38976805651'
WHERE contact_phone IS NULL OR btrim(contact_phone) = '';

ALTER TABLE public.service_listing_requests
  ALTER COLUMN contact_phone SET NOT NULL;
