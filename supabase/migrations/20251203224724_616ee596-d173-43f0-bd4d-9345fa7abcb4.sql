-- Create table for storing WebAuthn credentials
CREATE TABLE public.webauthn_credentials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credential_id text NOT NULL UNIQUE,
    public_key text NOT NULL,
    counter bigint NOT NULL DEFAULT 0,
    device_name text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    last_used_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- Users can view their own credentials
CREATE POLICY "Users can view own credentials"
ON public.webauthn_credentials
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own credentials
CREATE POLICY "Users can insert own credentials"
ON public.webauthn_credentials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own credentials
CREATE POLICY "Users can delete own credentials"
ON public.webauthn_credentials
FOR DELETE
USING (auth.uid() = user_id);

-- Users can update their own credentials (for counter updates)
CREATE POLICY "Users can update own credentials"
ON public.webauthn_credentials
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_webauthn_credentials_user_id ON public.webauthn_credentials(user_id);
CREATE INDEX idx_webauthn_credentials_credential_id ON public.webauthn_credentials(credential_id);