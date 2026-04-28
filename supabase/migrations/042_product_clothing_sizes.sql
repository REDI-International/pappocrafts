-- Optional size availability for textile/clothing products.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS available_sizes TEXT[] NOT NULL DEFAULT '{}';
