
-- Add email column to vip_members
ALTER TABLE public.vip_members ADD COLUMN IF NOT EXISTS email text;

-- Support both vip_settings schema variants:
-- 1) key/value table
-- 2) single-row settings table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vip_settings' AND column_name = 'key'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vip_settings' AND column_name = 'value'
  ) THEN
    INSERT INTO public.vip_settings (key, value)
    VALUES ('consent_text', 'קראתי והבנתי את תקנון ה-VIP ומדיניות הפרטיות')
    ON CONFLICT (key) DO NOTHING;
  ELSE
    ALTER TABLE public.vip_settings ADD COLUMN IF NOT EXISTS consent_text text;
    UPDATE public.vip_settings
    SET consent_text = COALESCE(consent_text, 'קראתי והבנתי את תקנון ה-VIP ומדיניות הפרטיות');
  END IF;
END $$;
