"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowBigUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpvoteButtonProps {
  requestId: string;
  initialCount: number;
  initialUpvoted: boolean;
  disabled?: boolean;
}

export function UpvoteButton({
  requestId,
  initialCount,
  initialUpvoted,
  disabled,
}: UpvoteButtonProps) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [loading, setLoading] = useState(false);

  async function toggleUpvote() {
    if (disabled || loading) return;
    setLoading(true);

    const method = upvoted ? "DELETE" : "POST";
    const res = await fetch("/api/upvotes", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });

    if (res.status === 401) {
      router.push("/auth/login");
      setLoading(false);
      return;
    }

    if (res.ok) {
      setUpvoted(!upvoted);
      setCount((c) => (upvoted ? c - 1 : c + 1));

      if (!upvoted && "Notification" in window && Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          await registerPushSubscription();
        }
      }
      router.refresh();
    }

    setLoading(false);
  }

  async function registerPushSubscription() {
    if (!("serviceWorker" in navigator) || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        ),
      });

      const json = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        }),
      });
    } catch (error) {
      console.error("Push subscription failed:", error);
    }
  }

  return (
    <Button
      variant={upvoted ? "default" : "outline"}
      size="sm"
      onClick={toggleUpvote}
      disabled={disabled || loading}
      className={cn("gap-1.5", upvoted && "bg-violet-600")}
    >
      <ArrowBigUp className={cn("h-4 w-4", upvoted && "fill-current")} />
      {count}
    </Button>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
