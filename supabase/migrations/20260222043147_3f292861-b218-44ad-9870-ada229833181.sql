
ALTER TABLE public.nfc_catalog_cards
  ADD COLUMN short_text text,
  ADD COLUMN long_text text,
  ADD COLUMN show_title boolean NOT NULL DEFAULT true,
  ADD COLUMN show_short_text boolean NOT NULL DEFAULT false,
  ADD COLUMN show_long_text boolean NOT NULL DEFAULT false;
