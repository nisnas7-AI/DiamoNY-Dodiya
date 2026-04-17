#!/usr/bin/env node
/**
 * Set a user's password via Supabase Auth Admin API (service role).
 *
 * Requires: SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.
 * Never commit the service role key or passwords.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   SUPABASE_URL=https://<ref>.supabase.co \
 *   node scripts/admin-set-user-password.mjs <email>
 *
 * Password from env (preferred — avoids argv in shell history):
 *   NEW_PASSWORD='your-new-password' node scripts/admin-set-user-password.mjs user@example.com
 *
 * Optional: load from repo root .env (only sets vars that are not already in the environment):
 *   node --env-file=.env scripts/admin-set-user-password.mjs user@example.com
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadRootEnvIfPresent() {
  const p = resolve(__dirname, "../.env");
  try {
    const text = readFileSync(p, "utf8");
    for (const raw of text.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const eq = line.indexOf("=");
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (key && process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    // ignore missing .env
  }
}

loadRootEnvIfPresent();

const supabaseUrl = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEW_SUPABASE_URL ||
  ""
).trim();
const serviceRoleKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEW_SUPABASE_SERVICE_ROLE_KEY ||
  ""
).trim();

const emailArg = (process.argv[2] || "").trim().toLowerCase();
const passwordFromEnv = (process.env.NEW_PASSWORD || "").trim();
const passwordArg = (process.argv[3] || "").trim();
const newPassword = passwordFromEnv || passwordArg;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing SUPABASE_URL (or VITE_SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Get the service role key from Supabase Dashboard → Project Settings → API (secret)."
  );
  process.exit(1);
}

if (!emailArg) {
  console.error("Usage: node scripts/admin-set-user-password.mjs <email>\n" + "Set NEW_PASSWORD in the environment, or pass the password as a second argument.");
  process.exit(1);
}

if (!newPassword) {
  console.error("Missing password: set NEW_PASSWORD env var or pass as second argument.");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserIdByEmail(targetEmail) {
  const normalized = targetEmail.toLowerCase();
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    const match = users.find((u) => (u.email || "").toLowerCase() === normalized);
    if (match) return match.id;
    if (users.length < perPage) break;
    page += 1;
  }
  return null;
}

try {
  const userId = await findUserIdByEmail(emailArg);
  if (!userId) {
    console.error(`No Auth user found with email: ${emailArg}`);
    console.error("If you meant Gmail, the address is usually @gmail.com (not .om).");
    process.exit(1);
  }

  const { data, error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) throw error;

  console.log("Password updated for:", data.user?.email || emailArg, "(id:", data.user?.id + ")");
} catch (e) {
  console.error(e?.message || e);
  process.exit(1);
}
