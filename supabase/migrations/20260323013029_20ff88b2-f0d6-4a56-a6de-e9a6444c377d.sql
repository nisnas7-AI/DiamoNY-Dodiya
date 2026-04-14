
CREATE TABLE public.certificate_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_name text NOT NULL UNIQUE,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.certificate_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read certificate images" ON public.certificate_images FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage certificate images" ON public.certificate_images FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.certificate_images (lab_name) VALUES ('GIA'), ('IGI'), ('HRD'), ('SGL'), ('CGL');
