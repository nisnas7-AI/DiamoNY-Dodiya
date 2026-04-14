-- Add local_content_overrides column for per-product content customization
ALTER TABLE products ADD COLUMN IF NOT EXISTS 
  local_content_overrides JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN products.local_content_overrides IS 'Stores product-specific content overrides: {preview, shortDesc, fullDesc, marketingCopy}';