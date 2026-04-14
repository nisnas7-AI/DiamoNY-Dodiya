-- Create product_stories table for centralized story management
CREATE TABLE public.product_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content_body TEXT,
  ai_prompt_context TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.product_stories ENABLE ROW LEVEL SECURITY;

-- Create policies for product_stories
CREATE POLICY "Product stories are viewable by everyone" 
ON public.product_stories 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage product stories" 
ON public.product_stories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add product_story_id to products table
ALTER TABLE public.products 
ADD COLUMN product_story_id UUID REFERENCES public.product_stories(id) ON DELETE SET NULL;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_product_stories_updated_at
BEFORE UPDATE ON public.product_stories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();