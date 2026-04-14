
-- Create site_reviews table for Google Reviews integration
CREATE TABLE public.site_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_name TEXT NOT NULL,
  review_text TEXT NOT NULL,
  google_review_url TEXT,
  star_rating INTEGER NOT NULL DEFAULT 5 CHECK (star_rating >= 1 AND star_rating <= 5),
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_reviews ENABLE ROW LEVEL SECURITY;

-- Public can read active reviews
CREATE POLICY "Anyone can read active reviews"
ON public.site_reviews
FOR SELECT
USING (is_active = true);

-- Admins can manage reviews
CREATE POLICY "Admins can manage reviews"
ON public.site_reviews
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add featured_review_id to products table
ALTER TABLE public.products ADD COLUMN featured_review_id UUID REFERENCES public.site_reviews(id) ON DELETE SET NULL;
