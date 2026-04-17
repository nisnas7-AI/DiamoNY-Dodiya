#!/usr/bin/env node
/**
 * Compare Auth users (email) between old and new Supabase projects.
 * Requires service role on BOTH projects — anon keys cannot call auth.admin.
 *
 * Env (from .env or shell):
 *   OLD_SUPABASE_URL, OLD_SUPABASE_SERVICE_ROLE_KEY
 *   NEW_SUPABASE_URL (or VITE_SUPABASE_URL), NEW_SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node --env-file=.env scripts/compare-auth-users-old-new.mjs
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
    /* no .env */
  }
}

loadRootEnvIfPresent();

const oldUrl = (process.env.OLD_SUPABASE_URL || "").trim();
const oldService = (process.env.OLD_SUPABASE_SERVICE_ROLE_KEY || "").trim();
const newUrl = (
  process.env.NEW_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  ""
).trim();
const newService = (process.env.NEW_SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!oldUrl || !oldService) {
  console.error(
    "Missing OLD_SUPABASE_URL or OLD_SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Add the old project service role (Dashboard → API) to .env locally — never commit it."
  );
  process.exit(1);
}
if (!newUrl || !newService) {
  console.error("Missing NEW_SUPABASE_URL (or SUPABASE_URL / VITE_SUPABASE_URL) or NEW_SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

async function listAllEmails(url, serviceKey) {
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const emails = new Set();
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);
    const users = data?.users ?? [];
    for (const u of users) {
      if (u.email) emails.add(u.email.toLowerCase());
    }
    if (users.length < perPage) break;
    page += 1;
  }
  return emails;
}

try {
  console.log("Fetching old project users…");
  const oldEmails = await listAllEmails(oldUrl, oldService);
  console.log("Fetching new project users…");
  const newEmails = await listAllEmails(newUrl, newService);

  const onlyOld = [...oldEmails].filter((e) => !newEmails.has(e)).sort();
  const onlyNew = [...newEmails].filter((e) => !oldEmails.has(e)).sort();
  const inBoth = [...oldEmails].filter((e) => newEmails.has(e)).length;

  console.log("\n--- Summary ---");
  console.log("Old project user count (with email):", oldEmails.size);
  console.log("New project user count (with email):", newEmails.size);
  console.log("Same email in both:", inBoth);
  console.log("\nEmails in OLD but not in NEW (" + onlyOld.length + "):");
  onlyOld.forEach((e) => console.log(" ", e));
  if (onlyOld.length > 0) {
    console.log("\n→ Create or import these users in the new project (Auth does not move with SQL migrations).");
  }
  console.log("\nEmails in NEW but not in OLD (" + onlyNew.length + "):");
  onlyNew.forEach((e) => console.log(" ", e));
  console.log(
    "\nNote: Password hashes are not portable; users must set/reset passwords on the new project unless you use a dedicated Auth export/import flow."
  );
} catch (e) {
  console.error(e?.message || e);
  process.exit(1);
}
