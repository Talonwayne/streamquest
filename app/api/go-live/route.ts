import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendGoLiveNotification } from "@/lib/notifications";
import { unwrapRelation } from "@/lib/utils";
import type { StreamPlatform } from "@/types/database";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { claimId, streamUrl, platform } = (await request.json()) as {
    claimId: string;
    streamUrl: string;
    platform: StreamPlatform;
  };

  if (!claimId || !streamUrl?.trim()) {
    return NextResponse.json({ error: "claimId and streamUrl required" }, { status: 400 });
  }

  const { data: claim } = await supabase
    .from("claims")
    .select("*, requests(id, title, author_id)")
    .eq("id", claimId)
    .eq("streamer_id", user.id)
    .single();

  if (!claim) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }

  const { data: liveSession, error: sessionError } = await supabase
    .from("live_sessions")
    .insert({
      claim_id: claimId,
      stream_url: streamUrl.trim(),
      platform: platform ?? "other",
    })
    .select()
    .single();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 400 });
  }

  const requestData = unwrapRelation(claim.requests);
  if (!requestData) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const { data: upvotes } = await supabase
    .from("upvotes")
    .select("user_id")
    .eq("request_id", claim.request_id);

  const recipientIds = new Set<string>([requestData.author_id]);
  upvotes?.forEach((u) => recipientIds.add(u.user_id));
  recipientIds.delete(user.id);

  const { data: streamerProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const streamerName = streamerProfile?.display_name ?? "A streamer";
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
        streamerName,
        requestTitle: requestData.title,
        streamUrl: streamUrl.trim(),
        platform: platform ?? "other",
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
