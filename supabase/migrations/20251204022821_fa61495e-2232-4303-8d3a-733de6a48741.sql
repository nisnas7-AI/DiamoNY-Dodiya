-- Add status fields to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'new',
ADD COLUMN IF NOT EXISTS contacted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS conversation_summary text,
ADD COLUMN IF NOT EXISTS closure_status text DEFAULT 'open';

-- Create customers table for newsletter/marketing database
CREATE TABLE IF NOT EXISTS public.customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    marketing_consent boolean DEFAULT true,
    consent_date timestamp with time zone DEFAULT now(),
    source text DEFAULT 'lead_conversion',
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- RLS policies for customers - only admins can manage
CREATE POLICY "Only admins can view customers" 
ON public.customers 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update customers" 
ON public.customers 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete customers" 
ON public.customers 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add update and delete policies for leads (admins only)
CREATE POLICY "Admins can update leads" 
ON public.leads 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete leads" 
ON public.leads 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for customers updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();