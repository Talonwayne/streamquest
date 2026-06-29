#!/usr/bin/env node
/**
 * Apply supabase/migrations/001_initial_schema.sql to a remote Postgres database.
 * Requires DATABASE_URL in .env.local (Supabase Dashboard → Settings → Database → Connection string).
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvLocal() {
  const path = resolve(root, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(
    "Missing DATABASE_URL in .env.local\n\n" +
      "Get it from Supabase Dashboard → Project Settings → Database → URI\n" +
      "Example: postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
  );
  process.exit(1);
}

const sql = readFileSync(
  resolve(root, "supabase/migrations/001_initial_schema.sql"),
  "utf8"
);

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("Connected. Applying migration...");
  await client.query(sql);
  console.log("Migration applied successfully.");

  const { rows } = await client.query(
    "select table_name from information_schema.tables where table_schema = 'public' order by table_name"
  );
  console.log("Public tables:", rows.map((r) => r.table_name).join(", "));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("already exists")) {
    console.log("Schema partially exists — migration may already be applied.");
    process.exit(0);
  }
  console.error("Migration failed:", message);
  process.exit(1);
} finally {
  await client.end();
}
