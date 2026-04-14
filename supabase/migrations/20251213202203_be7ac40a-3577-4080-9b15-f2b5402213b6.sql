-- Add parent_id column for hierarchical categories
ALTER TABLE categories 
ADD COLUMN parent_id uuid REFERENCES categories(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_categories_parent_id ON categories(parent_id);