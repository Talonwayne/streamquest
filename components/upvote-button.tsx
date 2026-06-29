"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowBigUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpvoteButtonProps {
  requestId: string;
  initialCount: number;
  initialUpvoted: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

export function UpvoteButton({
  requestId,
  initialCount,
  initialUpvoted,
  disabled,
  disabledReason,
}: UpvoteButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [count, setCount] = useState(initialCount);
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleUpvote() {
    if (disabled || loading) return;
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const next = encodeURIComponent(pathname);
      router.push(`/auth/login?next=${next}`);
      return;
    }

    setLoading(true);

    try {
      if (upvoted) {
        const { error: deleteError } = await supabase
          .from("upvotes")
          .delete()
          .eq("request_id", requestId)
          .eq("user_id", user.id);

        if (deleteError) {
          setError(deleteError.message);
          return;
        }

        setUpvoted(false);
        setCount((c) => Math.max(0, c - 1));
      } else {
        const { error: insertError } = await supabase.from("upvotes").insert({
          request_id: requestId,
          user_id: user.id,
        });

        if (insertError) {
          if (insertError.code === "23505") {
            setUpvoted(true);
          } else {
            setError(insertError.message);
            return;
          }
        } else {
          setUpvoted(true);
          setCount((c) => c + 1);

          if ("Notification" in window && Notification.permission === "default") {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
              await registerPushSubscription();
            }
          }
        }
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
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
        credentials: "include",
        body: JSON.stringify({
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        }),
      });
    } catch (pushError) {
      console.error("Push subscription failed:", pushError);
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <Button
        variant={upvoted ? "default" : "outline"}
        size="sm"
        onClick={toggleUpvote}
        disabled={disabled || loading}
        title={disabled ? disabledReason : upvoted ? "Remove upvote" : "Upvote to get notified"}
        aria-label={
          disabled
            ? disabledReason
            : upvoted
              ? `Remove upvote (${count})`
              : `Upvote (${count})`
        }
        className={cn("gap-1.5", upvoted && "bg-violet-600")}
      >
        <ArrowBigUp className={cn("h-4 w-4", upvoted && "fill-current")} />
        {count}
      </Button>
      {disabled && disabledReason && (
        <span className="text-xs text-zinc-500">{disabledReason}</span>
      )}
      {error && <span className="max-w-[140px] text-right text-xs text-red-400">{error}</span>}
    </div>
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
