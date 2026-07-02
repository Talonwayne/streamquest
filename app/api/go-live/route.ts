import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendGoLiveNotification } from "@/lib/notifications";
import { validateStreamUrl } from "@/lib/stream-links";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    requestId?: string;
    claimId?: string;
    streamUrl: string;
    platform?: string;
  };

  const { streamUrl } = body;
  let requestId = body.requestId;

  if (!requestId && body.claimId) {
    const { data: claim } = await supabase
      .from("claims")
      .select("request_id")
      .eq("id", body.claimId)
      .eq("streamer_id", user.id)
      .maybeSingle();
    requestId = claim?.request_id;
  }

  if (!requestId || !streamUrl?.trim()) {
    return NextResponse.json(
      { error: "requestId and streamUrl required" },
      { status: 400 }
    );
  }

  const validation = validateStreamUrl(streamUrl);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const normalizedUrl = validation.normalizedUrl!;
  const platform = validation.platform;

  const { data: requestData } = await supabase
    .from("requests")
    .select("id, title, author_id, status")
    .eq("id", requestId)
    .single();

  if (!requestData) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (requestData.status === "completed") {
    return NextResponse.json({ error: "Request is completed" }, { status: 400 });
  }

  const { data: existingSession } = await supabase
    .from("live_sessions")
    .select("id")
    .eq("request_id", requestId)
    .eq("streamer_id", user.id)
    .is("ended_at", null)
    .maybeSingle();

  if (existingSession) {
    return NextResponse.json(
      { error: "You already have an active stream link on this request" },
      { status: 400 }
    );
  }

  const { data: liveSession, error: sessionError } = await supabase
    .from("live_sessions")
    .insert({
      request_id: requestId,
      streamer_id: user.id,
      stream_url: normalizedUrl,
      platform,
    })
    .select()
    .single();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 400 });
  }

  const { data: upvotes } = await supabase
    .from("upvotes")
    .select("user_id")
    .eq("request_id", requestId);

  const recipientIds = new Set<string>([requestData.author_id]);
  upvotes?.forEach((u) => recipientIds.add(u.user_id));
  recipientIds.delete(user.id);

  const { data: posterProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const posterName = posterProfile?.display_name ?? "A streamer";
  let notificationsSent = 0;

  try {
    const serviceClient = await createServiceClient();

    for (const recipientId of recipientIds) {
      const { data: recipientAuth } = await serviceClient.auth.admin.getUserById(
        recipientId
      );
      const email = recipientAuth?.user?.email;

      const { data: pushSub } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", recipientId)
        .limit(1)
        .maybeSingle();

      const emailResult = await sendGoLiveNotification({
        userId: recipientId,
        email,
        streamerName: posterName,
        requestTitle: requestData.title,
        streamUrl: normalizedUrl,
        platform,
        pushSubscription: pushSub,
      });

      if (emailResult.email) {
        await serviceClient.from("notifications").insert({
          user_id: recipientId,
          live_session_id: liveSession.id,
          channel: "email",
          status: "sent",
        });
        notificationsSent++;
      }

      if (emailResult.push) {
        await serviceClient.from("notifications").insert({
          user_id: recipientId,
          live_session_id: liveSession.id,
          channel: "push",
          status: "sent",
        });
        notificationsSent++;
      }
    }
  } catch (error) {
    console.warn("Notification fan-out skipped:", error);
  }

  return NextResponse.json(
    { ...liveSession, notificationsSent },
    { status: 201 }
  );
}
