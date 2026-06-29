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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "streamer" && profile.role !== "both")) {
    return NextResponse.json({ error: "Streamer role required" }, { status: 403 });
  }

  const { requestId } = await request.json();
  if (!requestId) {
    return NextResponse.json({ error: "requestId required" }, { status: 400 });
  }

  const { data: existingRequest } = await supabase
    .from("requests")
    .select("status")
    .eq("id", requestId)
    .single();

  if (!existingRequest || existingRequest.status !== "open") {
    return NextResponse.json({ error: "Request is not available to claim" }, { status: 400 });
  }

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .insert({
      request_id: requestId,
      streamer_id: user.id,
    })
    .select()
    .single();

  if (claimError) {
    return NextResponse.json({ error: claimError.message }, { status: 400 });
  }

  return NextResponse.json(claim, { status: 201 });
}
