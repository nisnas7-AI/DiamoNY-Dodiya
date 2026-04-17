/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  readonly VITE_SITE_URL?: string
  readonly VITE_FEATURE_NFC_CATALOG?: string
  readonly VITE_FEATURE_DIGITAL_CARD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
