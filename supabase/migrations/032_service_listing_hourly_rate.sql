-- Hourly rate and currency for public service listing requests (stored as submitted)
ALTER TABLE public.service_listing_requests
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'EUR';
