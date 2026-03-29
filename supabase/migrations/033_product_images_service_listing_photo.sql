-- Product gallery (up to 5 URLs) + optional service listing request photo
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}';

UPDATE public.products
SET images = ARRAY[trim(image)]::TEXT[]
WHERE cardinality(images) = 0
  AND coalesce(trim(image), '') <> '';

ALTER TABLE public.service_listing_requests
  ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';
