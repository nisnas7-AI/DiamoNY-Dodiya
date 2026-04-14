-- Add privacy policy consent fields to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS consent_privacy_policy boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_privacy_timestamp timestamp with time zone,
ADD COLUMN IF NOT EXISTS consent_marketing_timestamp timestamp with time zone,
ADD COLUMN IF NOT EXISTS ip_address text;

-- Add privacy policy consent fields to customers table  
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS consent_privacy_policy boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_privacy_timestamp timestamp with time zone,
ADD COLUMN IF NOT EXISTS consent_marketing_timestamp timestamp with time zone,
ADD COLUMN IF NOT EXISTS ip_address text;

-- Create welcome_email_settings table for admin-editable email template
CREATE TABLE IF NOT EXISTS public.welcome_email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_line text NOT NULL DEFAULT 'ברוכים הבאים ל-DiamoNY ✨ | העיצוב הבא שלך מתחיל כאן',
  logo_url text,
  greeting_template text NOT NULL DEFAULT 'היי {{name}},',
  greeting_fallback text NOT NULL DEFAULT 'שלום רב,',
  intro_text text NOT NULL DEFAULT 'תודה שבחרת להצטרף למועדון הלקוחות של DiamoNY. עבורי, תכשיט הוא הרבה יותר מזהב ויהלומים – הוא ביטוי אישי, זיכרון שנשמר לנצח, ויצירת אומנות שמספרת את הסיפור שלך.',
  designer_message text NOT NULL DEFAULT 'כמעצב, המטרה שלי היא להביא לך את השילוב המדויק שבין עיצוב על-זמני לבין הטרנדים הכי חמים בעולם התכשיטנות.',
  benefits_title text NOT NULL DEFAULT 'מה מחכה לך כאן?',
  benefits_text text NOT NULL DEFAULT 'כחלק מהקהילה שלנו, תהיו הראשונים להיחשף לקולקציות חדשות, לקבל השראה לעיצובים מיוחדים, וליהנות מהטבות השמורות לחברים בלבד.',
  privacy_note text NOT NULL DEFAULT 'אני מכבד את הזמן והפרטיות שלך (בדיוק כפי שהתחייבתי באתר), ולכן אדאג לשלוח לך רק תוכן בעל ערך, יופי והשראה.',
  gift_title text NOT NULL DEFAULT 'מתנה קטנה להתחלה נוצצת',
  gift_text text NOT NULL DEFAULT 'כדי לחגוג את הצטרפותך, אני מזמין אותך ליהנות מ-10% הנחה ברכישה הראשונה שלך.',
  coupon_code text DEFAULT 'WELCOME10',
  cta_button_text text NOT NULL DEFAULT 'לצפייה בקולקציה החדשה',
  cta_button_url text NOT NULL DEFAULT '/catalog',
  signature_name text NOT NULL DEFAULT 'יעקובי ניצן',
  signature_title text NOT NULL DEFAULT 'וצוות DiamoNY',
  instagram_url text DEFAULT 'https://instagram.com',
  facebook_url text DEFAULT 'https://facebook.com',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.welcome_email_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for welcome_email_settings
CREATE POLICY "Admins can manage welcome email settings"
ON public.welcome_email_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Welcome email settings are viewable by system"
ON public.welcome_email_settings
FOR SELECT
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_welcome_email_settings_updated_at
BEFORE UPDATE ON public.welcome_email_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default welcome email settings
INSERT INTO public.welcome_email_settings (id) 
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;