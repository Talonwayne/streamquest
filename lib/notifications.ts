import { Resend } from "resend";
import webpush from "web-push";
import type { StreamPlatform } from "@/types/database";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:notifications@streamquest.app",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface GoLiveNotificationParams {
  userId: string;
  email: string | undefined;
  streamerName: string;
  requestTitle: string;
  streamUrl: string;
  platform: StreamPlatform;
  pushSubscription?: {
    endpoint: string;
    p256dh: string;
    auth: string;
  } | null;
}

const platformLabels: Record<StreamPlatform, string> = {
  twitch: "Twitch",
  youtube: "YouTube",
  kick: "Kick",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  other: "Stream",
};

export async function sendGoLiveNotification(
  params: GoLiveNotificationParams
): Promise<{ email: boolean; push: boolean }> {
  const result = { email: false, push: false };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const platformLabel = platformLabels[params.platform];

  if (resend && params.email) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "Streamquest <onboarding@resend.dev>",
        to: params.email,
        subject: `Live now: ${params.requestTitle}`,
        html: `
          <p><strong>${params.streamerName}</strong> is live with your request:</p>
          <p><em>${params.requestTitle}</em></p>
          <p><a href="${params.streamUrl}">Watch on ${platformLabel}</a></p>
          <p style="color:#888;font-size:12px;">You received this because you requested or upvoted this idea on <a href="${appUrl}">Streamquest</a>.</p>
        `,
      });
      result.email = true;
    } catch (error) {
      console.error("Email notification failed:", error);
    }
  }

  if (params.pushSubscription && process.env.VAPID_PRIVATE_KEY) {
    try {
      await webpush.sendNotification(
        {
          endpoint: params.pushSubscription.endpoint,
          keys: {
            p256dh: params.pushSubscription.p256dh,
            auth: params.pushSubscription.auth,
          },
        },
        JSON.stringify({
          title: `Live: ${params.requestTitle}`,
          body: `${params.streamerName} is streaming on ${platformLabel}`,
          url: params.streamUrl,
        })
      );
      result.push = true;
    } catch (error) {
      console.error("Push notification failed:", error);
    }
  }

  return result;
}
