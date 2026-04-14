
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES public.vip_cards(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit service requests" ON public.service_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage service requests" ON public.service_requests FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
