import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    liveSessionId?: string;
    sessionId?: string;
  };

  const sessionId = body.liveSessionId ?? body.sessionId;
  if (!sessionId) {
    return NextResponse.json({ error: "liveSessionId required" }, { status: 400 });
  }

  const { data: session, error: fetchError } = await supabase
    .from("live_sessions")
    .select("id, streamer_id, ended_at, request_id")
    .eq("id", sessionId)
    .single();

  if (fetchError || !session) {
    return NextResponse.json({ error: "Live session not found" }, { status: 404 });
  }

  if (session.streamer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (session.ended_at) {
    return NextResponse.json({ error: "Session already ended" }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("live_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("streamer_id", user.id)
    .is("ended_at", null)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json(updated);
}
