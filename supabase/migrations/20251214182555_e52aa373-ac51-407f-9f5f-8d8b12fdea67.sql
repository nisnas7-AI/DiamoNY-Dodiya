-- Step 1: Extend leads table with UTM tracking and jewelry preferences
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS referral_source TEXT,
ADD COLUMN IF NOT EXISTS landing_page TEXT,
ADD COLUMN IF NOT EXISTS jewelry_interest_type TEXT,
ADD COLUMN IF NOT EXISTS estimated_budget TEXT,
ADD COLUMN IF NOT EXISTS metal_preference TEXT,
ADD COLUMN IF NOT EXISTS ring_size TEXT,
ADD COLUMN IF NOT EXISTS event_target_date DATE,
ADD COLUMN IF NOT EXISTS pages_viewed JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS form_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS form_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'contact_form';

-- Step 2: Extend customers table with event dates and preferences
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS anniversary DATE,
ADD COLUMN IF NOT EXISTS preferred_gold_type TEXT,
ADD COLUMN IF NOT EXISTS ring_size TEXT,
ADD COLUMN IF NOT EXISTS preferred_stones TEXT,
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS jewelry_interest_type TEXT;

-- Step 3: Create customer_files table for inspiration images and 3D models
CREATE TABLE IF NOT EXISTS customer_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('inspiration', '3d_model', 'sketch', 'final_product', 'other')),
  file_url TEXT NOT NULL,
  original_filename TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE customer_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view customer files" ON customer_files
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert customer files" ON customer_files
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update customer files" ON customer_files
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete customer files" ON customer_files
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Step 4: Create customer_events table for birthdays, anniversaries, reminders
CREATE TABLE IF NOT EXISTS customer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('birthday', 'anniversary', 'custom')),
  event_name TEXT,
  event_date DATE NOT NULL,
  reminder_days_before INTEGER DEFAULT 30,
  reminder_sent BOOLEAN DEFAULT false,
  last_reminder_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE customer_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view customer events" ON customer_events
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert customer events" ON customer_events
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update customer events" ON customer_events
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete customer events" ON customer_events
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Step 5: Create custom_orders table for production tracking
CREATE TABLE IF NOT EXISTS custom_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'consultation' CHECK (status IN ('consultation', 'sketch_pending', 'sketch_approved', 'casting', 'setting', 'polishing', 'ready', 'delivered', 'cancelled')),
  estimated_price NUMERIC,
  final_price NUMERIC,
  
  -- Production stage timestamps
  consultation_at TIMESTAMPTZ DEFAULT now(),
  sketch_approved_at TIMESTAMPTZ,
  casting_started_at TIMESTAMPTZ,
  setting_started_at TIMESTAMPTZ,
  polishing_started_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Notes
  sketch_notes TEXT,
  production_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view custom orders" ON custom_orders
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert custom orders" ON custom_orders
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update custom orders" ON custom_orders
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete custom orders" ON custom_orders
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_custom_orders_updated_at
  BEFORE UPDATE ON custom_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Create order_files table for files attached to orders
CREATE TABLE IF NOT EXISTS order_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES custom_orders(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('sketch', '3d_render', 'wax_model', 'progress_photo', 'final_photo', 'other')),
  file_url TEXT NOT NULL,
  stage TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE order_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view order files" ON order_files
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert order files" ON order_files
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update order files" ON order_files
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete order files" ON order_files
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Step 7: Create page_views table for visitor tracking
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  duration_seconds INTEGER,
  utm_source TEXT,
  utm_campaign TEXT,
  utm_medium TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view page views" ON page_views
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert page views" ON page_views
  FOR INSERT WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_events_event_date ON customer_events(event_date);
CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON custom_orders(status);
CREATE INDEX IF NOT EXISTS idx_custom_orders_customer_id ON custom_orders(customer_id);