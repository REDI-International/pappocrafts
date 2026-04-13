-- Remove all occurrences of the old public phone number from services.phone.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'services'
      AND column_name = 'phone'
  ) THEN
    UPDATE public.services
    SET phone = replace(phone, '+38976805651', '')
    WHERE phone LIKE '%+38976805651%';
  END IF;
END
$$;
