-- Add DELETE policy to profiles table for GDPR compliance
-- Only admins can delete profiles (users cannot delete their own profiles directly)
CREATE POLICY "Only admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));