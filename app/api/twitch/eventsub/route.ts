import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

function verifyTwitchSignature(
  messageId: string,
  timestamp: string,
  body: string,
  signature: string
): boolean {
  const secret = process.env.TWITCH_EVENTSUB_SECRET;
  if (!secret) return false;
  const message = messageId + timestamp + body;
  const expected =
    "sha256=" +
    createHmac("sha256", secret).update(message).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const bodyText = await request.text();
  const messageId = request.headers.get("twitch-eventsub-message-id") ?? "";
  const timestamp = request.headers.get("twitch-eventsub-message-timestamp") ?? "";
  const signature = request.headers.get("twitch-eventsub-message-signature") ?? "";
  const messageType = request.headers.get("twitch-eventsub-message-type") ?? "";

  if (!verifyTwitchSignature(messageId, timestamp, bodyText, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const payload = JSON.parse(bodyText) as {
    challenge?: string;
    subscription?: { type?: string };
    event?: { broadcaster_user_id?: string };
  };

  if (messageType === "webhook_callback_verification") {
    return new NextResponse(payload.challenge ?? "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  if (messageType === "notification") {
    const type = payload.subscription?.type;
    const broadcasterId = payload.event?.broadcaster_user_id;

    if (type === "stream.offline" && broadcasterId) {
      try {
        const supabase = await createServiceClient();
        const now = new Date().toISOString();

        // End sessions tied to this Twitch user id
        await supabase
          .from("live_sessions")
          .update({ ended_at: now })
          .eq("platform", "twitch")
          .eq("platform_user_id", broadcasterId)
          .is("ended_at", null);

        // Also end via streamer_profiles.twitch_user_id
        const { data: profiles } = await supabase
          .from("streamer_profiles")
          .select("user_id")
          .eq("twitch_user_id", broadcasterId);

        for (const p of profiles ?? []) {
          await supabase
            .from("live_sessions")
            .update({ ended_at: now })
            .eq("streamer_id", p.user_id)
            .eq("platform", "twitch")
            .is("ended_at", null);
        }
      } catch (error) {
        console.warn("EventSub offline handling failed:", error);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
