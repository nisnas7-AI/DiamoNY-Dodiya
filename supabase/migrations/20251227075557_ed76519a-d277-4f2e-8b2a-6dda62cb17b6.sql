-- Add mto_story column to products table with default value
ALTER TABLE public.products 
ADD COLUMN mto_story TEXT DEFAULT 'כל תכשיט שלנו נוצר במיוחד עבורך. התהליך כולל פגישת ייעוץ אישית, תכנון ועיצוב, יציקה ידנית, שיבוץ אבנים, והשלמה עד לתוצאה מושלמת שמשקפת את הייחודיות שלך.';

-- Add mto_story column to categories table
ALTER TABLE public.categories 
ADD COLUMN mto_story TEXT DEFAULT NULL;