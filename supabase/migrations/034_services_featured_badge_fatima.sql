-- Featured pill on services listing: append lowercase tag read by hasFeaturedMarker().
UPDATE public.services
SET badges = CASE
  WHEN COALESCE(badges, '{}') @> ARRAY['featured']::text[] THEN badges
  ELSE COALESCE(badges, '{}') || ARRAY['featured']::text[]
END
WHERE id = 'fatima-dogsitter-pristina';
