#!/usr/bin/env python3
"""
Deploy this Vite/React project to Cloudways (or any host) over SSH.

Auth modes (pick one):
  - Password: set CLOUDWAYS_SSH_PASSWORD (uses Paramiko; no ssh/rsync needed for deploy)
  - Key file:  set CLOUDWAYS_SSH_KEY to a private key path (uses rsync + ssh, non-interactive)

Usage:
  pip install -r scripts/cloudways/requirements.txt
  python scripts/cloudways/deploy.py --env scripts/cloudways/.env
"""

from __future__ import annotations

import argparse
import os
import shlex
import shutil
import subprocess
import sys
from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_dotenv(path: Path) -> None:
    if not path.is_file():
        return
    try:
        from dotenv import load_dotenv

        load_dotenv(path, override=True)
    except ImportError:
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            os.environ[key] = val


def require_env(name: str) -> str:
    v = os.environ.get(name, "").strip()
    if not v:
        print(f"Missing required environment variable: {name}", file=sys.stderr)
        sys.exit(1)
    return v


def resolved_ssh_key_path(key: str) -> str | None:
    key = key.strip()
    if not key:
        return None
    expanded = os.path.expanduser(key)
    if os.path.isfile(expanded):
        return expanded
    print(
        f"Warning: CLOUDWAYS_SSH_KEY is not a file ({key!r}). Ignoring for key-based mode.",
        file=sys.stderr,
    )
    return None


EXCLUDES_DIR = frozenset(
    {
        "node_modules",
        ".git",
        "dist",
        ".cursor",
        "terminals",
        "__pycache__",
        ".venv",
        "venv",
    }
)
EXCLUDES_FILE = frozenset({".env", "cloudways.env"})


def path_has_excluded_part(rel: Path) -> bool:
    return any(p in EXCLUDES_DIR or p in EXCLUDES_FILE for p in rel.parts)


def ssh_connect_password(host: str, port: int, user: str, password: str):
    import paramiko

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=host,
        port=port,
        username=user,
        password=password,
        look_for_keys=False,
        allow_agent=False,
        timeout=60,
    )
    return client


def ssh_exec(client, bash_script: str, timeout: int = 7200) -> int:
    """Run script via bash -lc; stream PTY output; return exit code."""
    import time

    stdin, stdout, stderr = client.exec_command(
        f"bash -lc {shlex.quote(bash_script)}",
        get_pty=True,
    )
    stdin.close()
    ch = stdout.channel
    deadline = time.monotonic() + timeout
    while not ch.exit_status_ready():
        if time.monotonic() > deadline:
            ch.close()
            raise TimeoutError(f"Remote command timed out after {timeout}s")
        if ch.recv_ready():
            chunk = ch.recv(16384)
            if chunk:
                sys.stdout.buffer.write(chunk)
                sys.stdout.buffer.flush()
        else:
            time.sleep(0.05)
    while ch.recv_ready():
        sys.stdout.buffer.write(ch.recv(16384))
        sys.stdout.buffer.flush()
    err_data = stderr.read()
    if err_data:
        sys.stderr.buffer.write(err_data)
        sys.stderr.buffer.flush()
    return ch.recv_exit_status()


def mkdir_p_remote(client, remote_path: str) -> None:
    code = ssh_exec(client, f"mkdir -p {shlex.quote(remote_path)}", timeout=120)
    if code != 0:
        raise RuntimeError(f"mkdir -p failed with exit {code}: {remote_path}")


def sync_local_to_remote_password(
    client,
    local_root: Path,
    remote_dir: str,
) -> None:
    local_root = local_root.resolve()
    remote_dir = remote_dir.rstrip("/")
    mkdir_p_remote(client, remote_dir)

    sftp = client.open_sftp()
    parents_made: set[str] = set()

    def ensure_remote_parent(remote_file: str) -> None:
        parent = str(Path(remote_file).parent).replace("\\", "/")
        if parent in parents_made:
            return
        mkdir_p_remote(client, parent)
        parents_made.add(parent)

    uploaded = 0
    for root, dirs, files in os.walk(local_root, topdown=True):
        dirs[:] = [d for d in dirs if d not in EXCLUDES_DIR and not d.startswith(".pytest")]
        root_path = Path(root)
        for name in files:
            if name in EXCLUDES_FILE or name.endswith(".pyc"):
                continue
            lp = root_path / name
            try:
                rel = lp.relative_to(local_root)
            except ValueError:
                continue
            if path_has_excluded_part(rel):
                continue
            if rel.as_posix() == "scripts/cloudways/.env":
                continue
            remote_file = f"{remote_dir}/{rel.as_posix()}"
            ensure_remote_parent(remote_file)
            sftp.put(str(lp), remote_file)
            uploaded += 1
            if uploaded % 200 == 0:
                print(f"  ... uploaded {uploaded} files", flush=True)

    sftp.close()
    print(f"Uploaded {uploaded} files to {remote_dir}", flush=True)


def ssh_base(host: str, user: str, port: str, key_path: str | None) -> list[str]:
    cmd = [
        "ssh",
        "-p",
        port,
        "-o",
        "StrictHostKeyChecking=accept-new",
        "-o",
        "BatchMode=yes",
    ]
    if key_path:
        cmd.extend(["-i", key_path])
    cmd.append(f"{user}@{host}")
    return cmd


def run_ssh_subprocess(host: str, user: str, port: str, key_path: str | None, remote_bash: str) -> int:
    base = ssh_base(host, user, port, key_path)
    full = base + [remote_bash]
    print("+", " ".join(full[:6]), "... [remote]", flush=True)
    return subprocess.call(full)


def run_rsync(
    local_root: Path,
    host: str,
    user: str,
    port: str,
    key_path: str | None,
    remote_dir: str,
) -> int:
    excludes = list(EXCLUDES_DIR | EXCLUDES_FILE | {"cloudways.env"})
    ssh_parts = [
        "ssh",
        f"-p{port}",
        "-o",
        "StrictHostKeyChecking=accept-new",
        "-o",
        "BatchMode=yes",
    ]
    if key_path:
        ssh_parts.extend(["-i", key_path])
    ssh_cmd = " ".join(shlex.quote(p) for p in ssh_parts)

    args = ["rsync", "-az", "--delete", "-e", ssh_cmd]
    for ex in excludes:
        args.extend(["--exclude", ex])
    args.append(str(local_root) + "/")
    args.append(f"{user}@{host}:{remote_dir}/")
    print("+ rsync ->", f"{user}@{host}:{remote_dir}/", flush=True)
    return subprocess.call(args)


def vite_export_block() -> str:
    """Shell exports for Vite `import.meta.env` — inject before `npm run build` on the remote host."""
    lines: list[str] = []
    for key in sorted(os.environ.keys()):
        if not key.startswith("VITE_"):
            continue
        val = os.environ.get(key)
        if val is None or str(val).strip() == "":
            continue
        lines.append(f"export {key}={shlex.quote(str(val))}")
    if not lines:
        return "# No VITE_* variables set in local env file — build uses defaults / empty Vite env.\n"
    return "\n".join(lines) + "\n"


def probe_script(remote_dir: str) -> str:
    """Shell snippet: print server state for a blank / Cloudways box."""
    parts: list[str] = [
        "set +e",
        'echo "========== SSH probe =========="',
        'echo "=== Identity ==="',
        "whoami",
        "id",
        'echo "pwd=$(pwd)"',
        'echo "=== OS ==="',
        "uname -a 2>/dev/null || true",
        'echo "=== Home (first lines) ==="',
        'ls -la "$HOME" 2>/dev/null | head -25',
        'echo "=== Cloudways applications dir ==="',
        "if [ -d /home/master/applications ]; then",
        "  ls -la /home/master/applications 2>/dev/null | head -40",
        "else",
        '  echo "(no /home/master/applications or no access)"',
        "fi",
    ]
    if remote_dir:
        q = shlex.quote(remote_dir)
        parts += [
            'echo "=== CLOUDWAYS_REMOTE_DIR ==="',
            f"if [ -d {q} ]; then echo exists: {q}; ls -la {q} 2>/dev/null | head -15;",
            f"else echo NOT_FOUND: {q}; fi",
            f"if [ -d {q} ] && [ -w {q} ]; then echo writable: yes; elif [ -d {q} ]; then echo writable: unknown; fi",
        ]
    parts += [
        'echo "=== Node / npm (needed for Vite build) ==="',
        "if command -v node >/dev/null 2>&1; then node -v; else echo node: NOT on PATH; fi",
        "if command -v npm >/dev/null 2>&1; then npm -v; else echo npm: NOT on PATH; fi",
        'if [ -f "$HOME/.nvm/nvm.sh" ]; then echo "hint: ~/.nvm/nvm.sh exists — add to .bashrc for non-interactive SSH"; fi',
        'echo "=== Git ==="',
        "command -v git >/dev/null 2>&1 && git --version || echo git: NOT on PATH",
        'echo "=== Web stack (optional) ==="',
        "command -v nginx >/dev/null 2>&1 && nginx -v 2>&1 || true",
        "command -v apache2 >/dev/null 2>&1 && apache2 -v 2>&1 || true",
        "command -v httpd >/dev/null 2>&1 && httpd -v 2>&1 || true",
        'echo "=== Disk ==="',
        "df -h . 2>/dev/null || df -h / 2>/dev/null || true",
        'echo "=== Done probe =========="',
    ]
    return "\n".join(parts) + "\n"


def remote_build_and_maybe_publish_script(remote_dir: str, publish_to_web_root: bool, vite_exports: str) -> str:
    """Run npm ci/build in remote_dir; optionally copy dist/ to parent public_html for Cloudways."""
    publish_block = ""
    if publish_to_web_root:
        publish_block = r"""
PUB="$(cd .. && pwd)"
if [ "$(basename "$PUB")" = "public_html" ]; then
  echo "Publishing dist/ -> $PUB (Vite expects asset paths from /) ..."
  test -d dist
  cp -r dist/. "$PUB"/
  cd "$PUB"
  if [ -f index.php ] && [ ! -f index.php.cloudways-phpstack-disabled ]; then
    mv -f index.php index.php.cloudways-phpstack-disabled
  fi
  cat > .htaccess <<'HTACCESS'
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
</IfModule>
HTACCESS
  # Nginx on this stack may serve extensionless copies as application/octet-stream
  # (browser download). Use real directories + index.html for deep-link entry paths.
  [ -f diamony-secure-admin ] && rm -f diamony-secure-admin
  [ -f admin ] && rm -f admin
  mkdir -p diamony-secure-admin admin
  cp -f index.html diamony-secure-admin/index.html
  cp -f index.html admin/index.html
  echo "Published static files to web root."
  echo "If /admin/ or /diamony-secure-admin/ still 404 externally, purge Varnish for this app in the Cloudways panel (edge caches old 404s until purged or TTL expires)."
else
  echo "CLOUDWAYS_PUBLISH_TO_WEB_ROOT is set but parent is not public_html ($PUB); skipping publish."
fi
"""
    return f"""
set -euo pipefail
mkdir -p "{remote_dir}"
cd "{remote_dir}"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node is not on PATH. On Cloudways, enable Node or load nvm in your SSH profile." >&2
  exit 1
fi

echo "Node: $(node -v)  npm: $(npm -v)"
{vite_exports}
npm ci
npm run build
{publish_block}
echo "Build finished. Static output: {remote_dir}/dist"
"""


def run_probe(host: str, port: int, user: str, password: str | None, key_path: str | None, remote_dir: str) -> int:
    script = probe_script(remote_dir)
    if password:
        client = ssh_connect_password(host, port, user, password)
        try:
            print("Running remote probe (password auth)...", flush=True)
            return ssh_exec(client, script, timeout=120)
        finally:
            client.close()
    if key_path:
        rc = run_ssh_subprocess(host, user, str(port), key_path, script)
        return rc
    return 1


def main() -> int:
    parser = argparse.ArgumentParser(description="SSH deploy to Cloudways")
    parser.add_argument(
        "--env",
        type=Path,
        default=Path(__file__).resolve().parent / "cloudways.env",
        help="Path to env file (e.g. scripts/cloudways/.env)",
    )
    parser.add_argument(
        "--skip-sync",
        action="store_true",
        help="Skip file upload; only run remote npm ci / build",
    )
    parser.add_argument(
        "--probe",
        action="store_true",
        help="Only SSH in and print server diagnostics (no upload, no build). "
        "CLOUDWAYS_REMOTE_DIR optional for probe.",
    )
    args = parser.parse_args()

    load_dotenv(args.env)

    host = require_env("CLOUDWAYS_HOST")
    user = require_env("CLOUDWAYS_USER")
    port = int((os.environ.get("CLOUDWAYS_SSH_PORT", "22").strip() or "22"))
    remote_dir = os.environ.get("CLOUDWAYS_REMOTE_DIR", "").strip().rstrip("/")

    password = (
        os.environ.get("CLOUDWAYS_SSH_PASSWORD", "").strip()
        or os.environ.get("CLOUDWAYS_PASSWORD", "").strip()
    )
    key_path = resolved_ssh_key_path(os.environ.get("CLOUDWAYS_SSH_KEY", ""))

    local_root = Path(
        os.environ.get("CLOUDWAYS_LOCAL_ROOT", str(repo_root()))
    ).resolve()

    if not local_root.is_dir():
        print(f"Local root is not a directory: {local_root}", file=sys.stderr)
        return 1

    use_password = bool(password)
    if not use_password and not key_path:
        print(
            "Set CLOUDWAYS_SSH_PASSWORD for password SSH, or CLOUDWAYS_SSH_KEY to a key file path.",
            file=sys.stderr,
        )
        return 1

    if use_password and key_path:
        print("Using CLOUDWAYS_SSH_PASSWORD (password mode). SSH key path is ignored.", flush=True)

    if args.probe:
        print(f"Probe target: {user}@{host}:{port}")
        if remote_dir:
            print(f"CLOUDWAYS_REMOTE_DIR: {remote_dir}")
        else:
            print("CLOUDWAYS_REMOTE_DIR: (not set — still listing server layout)")
        print()
        return run_probe(host, port, user, password if use_password else None, key_path, remote_dir)

    if not remote_dir:
        print("Missing CLOUDWAYS_REMOTE_DIR (required for deploy; optional for --probe).", file=sys.stderr)
        return 1

    skip_sync = args.skip_sync or os.environ.get("CLOUDWAYS_SKIP_RSYNC", "").strip().lower() in (
        "1",
        "true",
        "yes",
    )
    publish_to_web_root = os.environ.get("CLOUDWAYS_PUBLISH_TO_WEB_ROOT", "").strip().lower() in (
        "1",
        "true",
        "yes",
    )

    print(f"Local:  {local_root}")
    print(f"Remote: {user}@{host}:{remote_dir}")
    print()

    if use_password:
        import paramiko  # noqa: F401 — checked at runtime

        client = ssh_connect_password(host, port, user, password)
        try:
            if not skip_sync:
                print("Syncing files over SFTP (password auth)...", flush=True)
                sync_local_to_remote_password(client, local_root, remote_dir)
            else:
                print("Skipping file sync (--skip-sync or CLOUDWAYS_SKIP_RSYNC).")

            remote_script = remote_build_and_maybe_publish_script(
                remote_dir, publish_to_web_root, vite_export_block()
            )
            print("Running remote build...", flush=True)
            code = ssh_exec(client, remote_script, timeout=7200)
            if code != 0:
                print(f"Remote build failed with exit {code}", file=sys.stderr)
                return code
        finally:
            client.close()
    else:
        for bin_name in ("ssh", "rsync"):
            if not shutil.which(bin_name):
                print(f"Required command not found: {bin_name}", file=sys.stderr)
                return 1
        if not skip_sync:
            rc = run_rsync(local_root, host, user, str(port), key_path, remote_dir)
            if rc != 0:
                print("rsync failed.", file=sys.stderr)
                return rc
        else:
            print("Skipping rsync.")

        remote_script = remote_build_and_maybe_publish_script(
            remote_dir, publish_to_web_root, vite_export_block()
        )
        rc = run_ssh_subprocess(host, user, str(port), key_path, remote_script)
        if rc != 0:
            print("Remote setup failed.", file=sys.stderr)
            return rc

    print()
    print("Done.")
    if publish_to_web_root:
        print(
            "Published to parent public_html when CLOUDWAYS_PUBLISH_TO_WEB_ROOT=1. "
            "Use your Cloudways application URL (see conf/server.nginx on the server); "
            "bare IP often returns 403 on Cloudways. "
            "After route or HTML changes, use Cloudways → Application → Purge Varnish so "
            "deep links are not stuck on a cached 404."
        )
    else:
        print(
            "Next: Point your app / Nginx document root to "
            f"`{remote_dir}/dist` for static hosting, or set "
            "CLOUDWAYS_PUBLISH_TO_WEB_ROOT=1 when deploying under public_html/<subdir>."
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
