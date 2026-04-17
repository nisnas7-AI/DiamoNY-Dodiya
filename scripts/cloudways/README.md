# Cloudways SSH deploy

## Setup

1. Copy `cloudways.env.example` to `.env` (or pass `--env` to `deploy.py`).
2. Fill `CLOUDWAYS_HOST`, `CLOUDWAYS_USER`, `CLOUDWAYS_SSH_PASSWORD` or `CLOUDWAYS_SSH_KEY`, and `CLOUDWAYS_REMOTE_DIR`.

## Vite environment on the remote build

Vite inlines `import.meta.env` at **build** time. Any variable the app reads as `import.meta.env.VITE_*` must be present in the shell when `npm run build` runs on the server.

`deploy.py` automatically emits `export VITE_FOO=...` lines for every non-empty `VITE_*` key found in the loaded env file, immediately before `npm ci` / `npm run build`.

Add to your Cloudways env file (same file as `CLOUDWAYS_*`):

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
# Optional:
# VITE_SITE_URL=https://your-domain.com
# VITE_FEATURE_NFC_CATALOG=true
# VITE_FEATURE_DIGITAL_CARD=true
```

Do not commit real secrets; keep the env file gitignored.

## Commands

```sh
pip install -r scripts/cloudways/requirements.txt
python scripts/cloudways/deploy.py --env scripts/cloudways/.env
```

- `--skip-sync` — only run remote `npm ci` / `build` (files already on server).
- `--probe` — print server diagnostics only.

See `deploy.py` module docstring for full options.
