
-- =============================================
-- COMPREHENSIVE SECURITY HARDENING MIGRATION
-- =============================================

-- ===== 1. ENABLE RLS ON ALL PUBLIC TABLES =====
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_section_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF to_regclass('public.design_assets') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.design_assets ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
ALTER TABLE public.welcome_email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variant_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.robots_txt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- ===== 2. PUBLIC-READ + ADMIN-WRITE CONTENT TABLES =====

-- Categories
CREATE POLICY "Anyone can read active categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins read all categories" ON public.categories FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update categories" ON public.categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete categories" ON public.categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Products (already has INSERT/UPDATE policies, add SELECT/DELETE)
CREATE POLICY "Anyone can read active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins read all products" ON public.products FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Product images (already has INSERT, add SELECT/UPDATE/DELETE)
CREATE POLICY "Anyone can read product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Admins update product images" ON public.product_images FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete product images" ON public.product_images FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Product variants
CREATE POLICY "Anyone can read variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admins insert variants" ON public.product_variants FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update variants" ON public.product_variants FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete variants" ON public.product_variants FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Product variant images
CREATE POLICY "Anyone can read variant images" ON public.product_variant_images FOR SELECT USING (true);
CREATE POLICY "Admins insert variant images" ON public.product_variant_images FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update variant images" ON public.product_variant_images FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete variant images" ON public.product_variant_images FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Product stories
CREATE POLICY "Anyone can read stories" ON public.product_stories FOR SELECT USING (true);
CREATE POLICY "Admins insert stories" ON public.product_stories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update stories" ON public.product_stories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete stories" ON public.product_stories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Testimonials
CREATE POLICY "Anyone can read active testimonials" ON public.testimonials FOR SELECT USING (is_active = true);
CREATE POLICY "Admins read all testimonials" ON public.testimonials FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert testimonials" ON public.testimonials FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update testimonials" ON public.testimonials FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete testimonials" ON public.testimonials FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Blog posts
CREATE POLICY "Anyone can read published posts" ON public.blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Admins read all posts" ON public.blog_posts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert posts" ON public.blog_posts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update posts" ON public.blog_posts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete posts" ON public.blog_posts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Homepage sections
CREATE POLICY "Anyone can read homepage sections" ON public.homepage_sections FOR SELECT USING (true);
CREATE POLICY "Admins insert homepage sections" ON public.homepage_sections FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update homepage sections" ON public.homepage_sections FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete homepage sections" ON public.homepage_sections FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Homepage section settings
CREATE POLICY "Anyone can read section settings" ON public.homepage_section_settings FOR SELECT USING (true);
CREATE POLICY "Admins insert section settings" ON public.homepage_section_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update section settings" ON public.homepage_section_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete section settings" ON public.homepage_section_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Homepage categories
CREATE POLICY "Anyone can read hp categories" ON public.homepage_categories FOR SELECT USING (true);
CREATE POLICY "Admins insert hp categories" ON public.homepage_categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update hp categories" ON public.homepage_categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete hp categories" ON public.homepage_categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Promotions
CREATE POLICY "Anyone can read active promos" ON public.promotions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins read all promos" ON public.promotions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert promos" ON public.promotions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update promos" ON public.promotions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete promos" ON public.promotions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Site content
CREATE POLICY "Anyone can read content" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Admins insert content" ON public.site_content FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update content" ON public.site_content FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete content" ON public.site_content FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Site settings
CREATE POLICY "Anyone can read settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins insert settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete settings" ON public.site_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Social settings
CREATE POLICY "Anyone can read social" ON public.social_settings FOR SELECT USING (true);
CREATE POLICY "Admins insert social" ON public.social_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update social" ON public.social_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete social" ON public.social_settings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Pages
CREATE POLICY "Anyone can read published pages" ON public.pages FOR SELECT USING (is_published = true);
CREATE POLICY "Admins read all pages" ON public.pages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert pages" ON public.pages FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update pages" ON public.pages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete pages" ON public.pages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Media
CREATE POLICY "Anyone can read media" ON public.media FOR SELECT USING (true);
CREATE POLICY "Admins insert media" ON public.media FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update media" ON public.media FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete media" ON public.media FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ===== 3. ADMIN-ONLY TABLES =====

-- Admin settings
CREATE POLICY "Admins read admin settings" ON public.admin_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update admin settings" ON public.admin_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User roles
CREATE POLICY "Users read own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Custom orders
CREATE POLICY "Admins read orders" ON public.custom_orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert orders" ON public.custom_orders FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update orders" ON public.custom_orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete orders" ON public.custom_orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Design assets (optional legacy module)
DO $$
BEGIN
  IF to_regclass('public.design_assets') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins read assets" ON public.design_assets';
    EXECUTE 'DROP POLICY IF EXISTS "Admins insert assets" ON public.design_assets';
    EXECUTE 'DROP POLICY IF EXISTS "Admins update assets" ON public.design_assets';
    EXECUTE 'DROP POLICY IF EXISTS "Admins delete assets" ON public.design_assets';
    EXECUTE 'CREATE POLICY "Admins read assets" ON public.design_assets FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
    EXECUTE 'CREATE POLICY "Admins insert assets" ON public.design_assets FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''admin''))';
    EXECUTE 'CREATE POLICY "Admins update assets" ON public.design_assets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
    EXECUTE 'CREATE POLICY "Admins delete assets" ON public.design_assets FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
  END IF;
END $$;

-- Welcome email settings
CREATE POLICY "Admins read email settings" ON public.welcome_email_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert email settings" ON public.welcome_email_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update email settings" ON public.welcome_email_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Robots txt history
CREATE POLICY "Admins read robots" ON public.robots_txt_history FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert robots" ON public.robots_txt_history FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- WebAuthn credentials
CREATE POLICY "Users read own webauthn" ON public.webauthn_credentials FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert webauthn" ON public.webauthn_credentials FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update webauthn" ON public.webauthn_credentials FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete webauthn" ON public.webauthn_credentials FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== 4. PUBLIC INSERT TABLES =====

-- Page views
CREATE POLICY "Anyone can insert views" ON public.page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read views" ON public.page_views FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Access logs
CREATE POLICY "Anyone can insert logs" ON public.access_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read logs" ON public.access_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ===== 5. SECURE VIP MEMBERS - REMOVE PUBLIC PHONE EXPOSURE =====

DROP POLICY IF EXISTS "Public can lookup active members" ON public.vip_members;
-- VIP login now handled via server-side edge function with service role key
-- Admin access retained via existing "Admins can manage vip_members" policy

-- ===== 6. DROP DANGEROUS UNAUTHENTICATED FUNCTIONS =====

DROP FUNCTION IF EXISTS public.public_approve_deal(uuid);
DROP FUNCTION IF EXISTS public.public_submit_deal_feedback(uuid, text);

-- ===== 7. CONDITIONAL: SERVICE REQUESTS & DEALS =====

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_requests') THEN
    EXECUTE 'ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can submit service requests" ON public.service_requests';
    EXECUTE 'CREATE POLICY "Validated inserts only" ON public.service_requests FOR INSERT WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "Admins read requests" ON public.service_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
    EXECUTE 'CREATE POLICY "Admins update requests" ON public.service_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deals') THEN
    EXECUTE 'ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Admins read deals" ON public.deals FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
    EXECUTE 'CREATE POLICY "Admins insert deals" ON public.deals FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''admin''))';
    EXECUTE 'CREATE POLICY "Admins update deals" ON public.deals FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
    EXECUTE 'CREATE POLICY "Admins delete deals" ON public.deals FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
  END IF;
END $$;

-- Add validation trigger for service requests if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_requests') THEN
    CREATE OR REPLACE FUNCTION public.validate_service_request_insert()
    RETURNS TRIGGER
    LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
    AS $func$
    BEGIN
      IF NEW.name IS NULL OR LENGTH(TRIM(NEW.name)) < 2 OR LENGTH(NEW.name) > 100 THEN
        RAISE EXCEPTION 'Name must be 2-100 characters';
      END IF;
      IF NEW.address IS NOT NULL AND LENGTH(NEW.address) > 500 THEN
        RAISE EXCEPTION 'Address must be under 500 characters';
      END IF;
      IF NEW.preferred_date IS NOT NULL AND NEW.preferred_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Preferred date must be in the future';
      END IF;
      NEW.name := LEFT(TRIM(NEW.name), 100);
      IF NEW.address IS NOT NULL THEN
        NEW.address := LEFT(TRIM(NEW.address), 500);
      END IF;
      RETURN NEW;
    END;
    $func$;

    EXECUTE 'DROP TRIGGER IF EXISTS validate_service_request_before_insert ON public.service_requests';
    EXECUTE 'CREATE TRIGGER validate_service_request_before_insert BEFORE INSERT ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.validate_service_request_insert()';
  END IF;
END $$;
