-- Service listing requests can specify if provider is currently available.
ALTER TABLE public.service_listing_requests
  ADD COLUMN IF NOT EXISTS available BOOLEAN NOT NULL DEFAULT TRUE;
