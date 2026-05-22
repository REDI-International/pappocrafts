-- Direct-approval tokens for email-based moderation by regional teams.
-- Each pending submission gets a UUID token that can be included in notification
-- emails, allowing reviewers to approve or reject without logging into the admin UI.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS approval_token UUID DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_approval_token
  ON public.products (approval_token)
  WHERE approval_token IS NOT NULL;

ALTER TABLE public.service_listing_requests
  ADD COLUMN IF NOT EXISTS approval_token UUID DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS idx_service_listing_requests_approval_token
  ON public.service_listing_requests (approval_token)
  WHERE approval_token IS NOT NULL;
