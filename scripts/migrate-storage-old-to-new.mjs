import { createClient } from "@supabase/supabase-js";

const required = [
  "OLD_SUPABASE_URL",
  "NEW_SUPABASE_URL",
  "NEW_SUPABASE_SERVICE_ROLE_KEY",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const oldBaseUrl = process.env.OLD_SUPABASE_URL;
const oldReadKey = process.env.OLD_SUPABASE_SERVICE_ROLE_KEY || process.env.OLD_SUPABASE_PUBLISHABLE_KEY;
const newBaseUrl = process.env.NEW_SUPABASE_URL;
const newServiceRole = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY;
const bucketCsv = process.env.BUCKETS || "vip-assets";

if (!oldReadKey) {
  throw new Error("Missing OLD_SUPABASE_SERVICE_ROLE_KEY or OLD_SUPABASE_PUBLISHABLE_KEY");
}

const oldClient = createClient(oldBaseUrl, oldReadKey, { auth: { persistSession: false } });
const newClient = createClient(newBaseUrl, newServiceRole, { auth: { persistSession: false } });

const buckets = bucketCsv
  .split(",")
  .map((b) => b.trim())
  .filter(Boolean);

const listAllPaths = async (client, bucket, prefix = "") => {
  const paths = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await client.storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) throw new Error(`[${bucket}] list error at "${prefix}": ${error.message}`);
    if (!data || data.length === 0) break;

    for (const item of data) {
      const itemPath = prefix ? `${prefix}/${item.name}` : item.name;

      // Folder entries have id === null in Storage list responses.
      if (item.id === null) {
        const childPaths = await listAllPaths(client, bucket, itemPath);
        paths.push(...childPaths);
      } else {
        paths.push(itemPath);
      }
    }

    if (data.length < limit) break;
    offset += limit;
  }

  return paths;
};

const migrateObject = async (bucket, path) => {
  const { data: file, error: downloadError } = await oldClient.storage.from(bucket).download(path);
  if (downloadError) {
    console.error(`[${bucket}] download failed: ${path} -> ${downloadError.message}`);
    return false;
  }

  const { error: uploadError } = await newClient.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (uploadError) {
    console.error(`[${bucket}] upload failed: ${path} -> ${uploadError.message}`);
    return false;
  }

  return true;
};

const main = async () => {
  console.log(`Starting migration from ${oldBaseUrl} to ${newBaseUrl}`);
  console.log(`Buckets: ${buckets.join(", ")}`);

  for (const bucket of buckets) {
    console.log(`\n[${bucket}] scanning objects...`);
    const paths = await listAllPaths(oldClient, bucket);
    console.log(`[${bucket}] found ${paths.length} objects`);

    let ok = 0;
    let fail = 0;

    for (const path of paths) {
      const success = await migrateObject(bucket, path);
      if (success) ok += 1;
      else fail += 1;
    }

    console.log(`[${bucket}] done. migrated=${ok}, failed=${fail}`);
  }

  console.log("\nStorage migration completed.");
};

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
