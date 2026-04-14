ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_mens_jewelry boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_mens_pendant boolean DEFAULT false;