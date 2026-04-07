-- Replace legacy public contact phone across listing tables.
UPDATE public.products
SET phone = '+38976805651'
WHERE phone = '+38976622243';

UPDATE public.services
SET phone = '+38976805651'
WHERE phone = '+38976622243';

UPDATE public.service_listing_requests
SET contact_phone = '+38976805651'
WHERE contact_phone = '+38976622243';
