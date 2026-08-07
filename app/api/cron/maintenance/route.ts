import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Allow in development without secret
    return process.env.NODE_ENV !== "production";
  }
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();

  // Refresh trending scores via SQL function when migration is applied
  const { error: trendError } = await supabase.rpc("refresh_all_trending_scores");

  // Auto-end zombie sessions older than 12 hours (safety net without EventSub)
  const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const { data: ended, error: endError } = await supabase
    .from("live_sessions")
    .update({ ended_at: new Date().toISOString() })
    .is("ended_at", null)
    .lt("started_at", cutoff)
    .select("id");

  return NextResponse.json({
    ok: true,
    trendingRefreshed: !trendError,
    trendingError: trendError?.message ?? null,
    autoEndedSessions: ended?.length ?? 0,
    endError: endError?.message ?? null,
  });
}
