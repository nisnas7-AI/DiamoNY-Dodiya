-- Fix leads table RLS: Only admins can view leads (not all authenticated users)
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;

CREATE POLICY "Only admins can view leads" 
ON public.leads 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Fix profiles table RLS: Only owner can view their profile (not everyone)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);