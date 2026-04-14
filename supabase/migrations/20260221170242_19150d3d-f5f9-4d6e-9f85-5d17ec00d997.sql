
-- Create NFC catalog cards table
CREATE TABLE IF NOT EXISTS public.nfc_catalog_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  image_url text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  custom_link text,
  section text NOT NULL DEFAULT 'women',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nfc_catalog_cards ENABLE ROW LEVEL SECURITY;

-- Public can read active cards
DROP POLICY IF EXISTS "Anyone can read active nfc cards" ON public.nfc_catalog_cards;
CREATE POLICY "Anyone can read active nfc cards"
  ON public.nfc_catalog_cards FOR SELECT
  USING (is_active = true);

-- Admin full CRUD
DROP POLICY IF EXISTS "Admins can manage nfc cards" ON public.nfc_catalog_cards;
CREATE POLICY "Admins can manage nfc cards"
  ON public.nfc_catalog_cards FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed women's cards (11) - category links are optional if category UUID is absent
INSERT INTO public.nfc_catalog_cards (title, section, display_order, category_id)
SELECT v.title, v.section, v.display_order,
       CASE
         WHEN v.category_id IS NULL THEN NULL
         WHEN EXISTS (SELECT 1 FROM public.categories c WHERE c.id = v.category_id) THEN v.category_id
         ELSE NULL
       END
FROM (
  VALUES
    ('טבעות יהלום'::text, 'women'::text, 1, 'f3477bb1-4d22-4945-affd-9b25f74dab41'::uuid),
    ('טבעות פנינים', 'women', 2, '0ab8b7d8-0a3f-4034-a9ab-21e6b8849922'::uuid),
    ('טבעות אבני חן', 'women', 3, 'cd8f4251-fe8b-4462-80ad-27788f344ced'::uuid),
    ('עגילי יהלומים', 'women', 4, 'd7453c11-0f53-4ba1-b9db-b7f46ff580eb'::uuid),
    ('עגיל משובץ אבני חן', 'women', 5, NULL::uuid),
    ('עגילי פנינים', 'women', 6, '795c972a-103d-4084-b0ec-1ac432507a87'::uuid),
    ('צמידי פנינים', 'women', 7, 'cba3e43f-6bfa-4b60-aac3-644b48d0fd38'::uuid),
    ('צמידי טניס', 'women', 8, '4cfb871f-cd51-4d4f-a45c-ec0ae0d5ea03'::uuid),
    ('תליון יהלומים', 'women', 9, 'de0b013a-1179-4bdf-b51a-03a192886e34'::uuid),
    ('מחרוזת פנינים', 'women', 10, NULL::uuid),
    ('תליון אבני חן', 'women', 11, NULL::uuid)
) AS v(title, section, display_order, category_id)
WHERE NOT EXISTS (
  SELECT 1 FROM public.nfc_catalog_cards e
  WHERE e.title = v.title AND e.section = v.section
);

-- Seed men's cards (4)
INSERT INTO public.nfc_catalog_cards (title, section, display_order, category_id)
SELECT v.title, v.section, v.display_order,
       CASE
         WHEN v.category_id IS NULL THEN NULL
         WHEN EXISTS (SELECT 1 FROM public.categories c WHERE c.id = v.category_id) THEN v.category_id
         ELSE NULL
       END
FROM (
  VALUES
    ('עגילי גברים'::text, 'men'::text, 1, NULL::uuid),
    ('צמידים לגבר', 'men', 2, NULL::uuid),
    ('תליון לגבר', 'men', 3, 'c5401bae-ff62-420c-a8ba-70125b041b3d'::uuid),
    ('טבעת לגבר', 'men', 4, '412da2ce-e688-4431-8b4d-2c9fc30d952c'::uuid)
) AS v(title, section, display_order, category_id)
WHERE NOT EXISTS (
  SELECT 1 FROM public.nfc_catalog_cards e
  WHERE e.title = v.title AND e.section = v.section
);
