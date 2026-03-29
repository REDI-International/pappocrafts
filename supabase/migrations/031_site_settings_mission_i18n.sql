-- Mission copy is translated in the app; remove CMS rows so API defaults stay empty and locales apply.
DELETE FROM public.site_settings
WHERE key IN ('mission_badge', 'mission_title', 'mission_desc1', 'mission_desc2');
