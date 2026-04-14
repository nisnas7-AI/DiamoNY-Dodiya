-- Add SEO keywords column for AEO optimization
ALTER TABLE testimonials 
ADD COLUMN seo_keywords text[] DEFAULT '{}'::text[];

-- Add comment for documentation
COMMENT ON COLUMN testimonials.seo_keywords IS 'SEO/AEO keywords for authority building (e.g., טבעת אירוסין בהזמנה אישית, צורף באשקלון)';