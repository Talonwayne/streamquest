#!/usr/bin/env node
/**
 * Populate local/staging Supabase with test users, requests, upvotes, and live sessions.
 *
 * Usage:
 *   npm run seed -- --confirm          # required for remote projects
 *   npm run seed -- --confirm --force  # re-apply seed data
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import {
  SEED_VERSION,
  SEED_MARKER_ID,
  DEFAULT_SEED_PASSWORD,
  STREAMERS,
  VIEWERS,
  REQUESTS,
  UPVOTES,
  LIVE_SESSIONS,
  ALL_USERS,
} from "./seed-data.mjs";

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

const args = process.argv.slice(2);
const confirmed = args.includes("--confirm");
const force = args.includes("--force");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
const seedPassword =
  process.env.SEED_TEST_PASSWORD ?? DEFAULT_SEED_PASSWORD;

function isLocalUrl(url) {
  return (
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("54321")
  );
}

function assertSafeToRun() {
  if (process.env.NODE_ENV === "production" && !confirmed) {
    console.error(
      "Refusing to seed: NODE_ENV=production. Pass --confirm only if intentional."
    );
    process.exit(1);
  }

  if (!supabaseUrl || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
    process.exit(1);
  }

  if (!isLocalUrl(supabaseUrl) && !confirmed) {
    console.error(
      "Seeding a remote Supabase project requires --confirm.\n" +
        "Example: npm run seed -- --confirm"
    );
    process.exit(1);
  }
}

assertSafeToRun();

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seedAlreadyApplied() {
  const { data, error } = await supabase
    .from("requests")
    .select("id")
    .eq("id", SEED_MARKER_ID)
    .maybeSingle();

  if (error && !error.message.includes("does not exist")) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

async function ensureUser(user) {
  const { data: existing, error: getError } =
    await supabase.auth.admin.getUserById(user.id);

  if (getError && getError.message !== "User not found") {
    throw new Error(`getUserById(${user.email}): ${getError.message}`);
  }

  if (existing?.user) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        email: user.email,
        password: seedPassword,
        email_confirm: true,
        user_metadata: { display_name: user.displayName },
      }
    );
    if (updateError) {
      throw new Error(`updateUser(${user.email}): ${updateError.message}`);
    }
    return existing.user.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    id: user.id,
    email: user.email,
    password: seedPassword,
    email_confirm: true,
    user_metadata: { display_name: user.displayName },
  });

  if (error) {
    throw new Error(`createUser(${user.email}): ${error.message}`);
  }

  return data.user.id;
}

async function upsertProfiles() {
  for (const user of ALL_USERS) {
    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        display_name: user.displayName,
        role: user.role,
      },
      { onConflict: "id" }
    );
    if (error) throw new Error(`profiles(${user.email}): ${error.message}`);
  }
}

async function upsertStreamerProfiles() {
  for (const streamer of STREAMERS) {
    const { error } = await supabase.from("streamer_profiles").upsert(
      {
        user_id: streamer.id,
        bio: streamer.bio,
        platform_links: streamer.platformLinks,
      },
      { onConflict: "user_id" }
    );
    if (error) {
      throw new Error(`streamer_profiles(${streamer.email}): ${error.message}`);
    }
  }
}

async function upsertRequests() {
  const rows = REQUESTS.map((r) => ({
    id: r.id,
    author_id: r.authorId,
    title: r.title,
    description: r.description,
    category: r.category,
    tags: r.tags,
    status: "open",
    ...(r.latitude != null && r.longitude != null
      ? {
          latitude: r.latitude,
          longitude: r.longitude,
          location_label: r.locationLabel ?? null,
        }
      : {}),
  }));

  const { error } = await supabase.from("requests").upsert(rows, {
    onConflict: "id",
  });
  if (error) throw new Error(`requests: ${error.message}`);

  const { error: markerError } = await supabase.from("requests").upsert(
    {
      id: SEED_MARKER_ID,
      author_id: VIEWERS[0].id,
      title: "[seed] Streamquest test data marker",
      description:
        "Internal marker row — do not delete. Indicates seed data v" +
        SEED_VERSION +
        " was applied.",
      category: "other",
      tags: ["seed", "internal"],
      status: "open",
    },
    { onConflict: "id" }
  );
  if (markerError) throw new Error(`seed marker: ${markerError.message}`);
}

async function upsertUpvotes() {
  const rows = [];
  for (const [requestId, userIds] of Object.entries(UPVOTES)) {
    for (const userId of userIds) {
      rows.push({ request_id: requestId, user_id: userId });
    }
  }

  const { error } = await supabase.from("upvotes").upsert(rows, {
    onConflict: "request_id,user_id",
    ignoreDuplicates: true,
  });
  if (error) throw new Error(`upvotes: ${error.message}`);
}

async function upsertLiveSessions() {
  for (const session of LIVE_SESSIONS) {
    const { data: existing } = await supabase
      .from("live_sessions")
      .select("id, ended_at")
      .eq("id", session.id)
      .maybeSingle();

    if (!existing) {
      const { error: insertError } = await supabase.from("live_sessions").insert({
        id: session.id,
        request_id: session.requestId,
        streamer_id: session.streamerId,
        stream_url: session.streamUrl,
        platform: session.platform,
        started_at: session.endedAt
          ? new Date(
              new Date(session.endedAt).getTime() - 2 * 60 * 60 * 1000
            ).toISOString()
          : new Date().toISOString(),
        ended_at: session.endedAt,
      });
      if (insertError) {
        throw new Error(`live_sessions insert(${session.id}): ${insertError.message}`);
      }
      continue;
    }

    const { error: updateError } = await supabase
      .from("live_sessions")
      .update({
        stream_url: session.streamUrl,
        platform: session.platform,
        ended_at: session.endedAt,
      })
      .eq("id", session.id);
    if (updateError) {
      throw new Error(`live_sessions update(${session.id}): ${updateError.message}`);
    }
  }

  for (const request of REQUESTS) {
    const { error } = await supabase
      .from("requests")
      .update({ status: request.status })
      .eq("id", request.id);
    if (error) {
      throw new Error(`request status(${request.title}): ${error.message}`);
    }
  }
}

async function refreshTrending() {
  for (const request of REQUESTS) {
    const { error } = await supabase.rpc("refresh_request_trending", {
      p_request_id: request.id,
    });
    if (error && !error.message.includes("does not exist")) {
      console.warn(`  trending refresh skipped for ${request.id}: ${error.message}`);
    }
  }
}

function printSummary() {
  console.log("\n--- Seed complete ---\n");
  console.log("Test password (override with SEED_TEST_PASSWORD in .env.local):");
  console.log(`  ${seedPassword}\n`);

  console.log("Streamer accounts:");
  for (const s of STREAMERS) {
    console.log(`  ${s.email}  (${s.displayName})`);
  }

  console.log("\nViewer accounts:");
  for (const v of VIEWERS) {
    console.log(`  ${v.email}  (${v.displayName})`);
  }

  console.log(`\nSample requests (${REQUESTS.length} total):`);
  for (const r of REQUESTS.slice(0, 5)) {
    console.log(`  [${r.status}] ${r.title} (${r.category})`);
  }
  console.log("  ...");

  console.log("\nLive sessions:");
  for (const ls of LIVE_SESSIONS) {
    const label = ls.endedAt ? "completed" : "live_now";
    console.log(`  [${label}] ${ls.streamUrl}`);
  }
}

try {
  if (!force && (await seedAlreadyApplied())) {
    console.log(
      "Seed data already present (marker request found). Use --force to re-apply."
    );
    printSummary();
    process.exit(0);
  }

  console.log("Creating test users...");
  for (const user of ALL_USERS) {
    await ensureUser(user);
    console.log(`  ✓ ${user.email}`);
  }

  console.log("Upserting profiles...");
  await upsertProfiles();
  await upsertStreamerProfiles();

  console.log("Upserting requests...");
  await upsertRequests();

  console.log("Upserting upvotes...");
  await upsertUpvotes();

  console.log("Upserting live sessions...");
  await upsertLiveSessions();

  console.log("Refreshing trending scores...");
  await refreshTrending();

  printSummary();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("\nSeed failed:", message);
  process.exit(1);
}
