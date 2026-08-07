"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PlatformLinkFormProps {
  initialTwitchUrl?: string;
  initialYoutubeUrl?: string;
  twitchLinked?: boolean;
  youtubeLinked?: boolean;
}

export function PlatformLinkForm({
  initialTwitchUrl = "",
  initialYoutubeUrl = "",
  twitchLinked = false,
  youtubeLinked = false,
}: PlatformLinkFormProps) {
  const router = useRouter();
  const [twitchUrl, setTwitchUrl] = useState(initialTwitchUrl);
  const [youtubeUrl, setYoutubeUrl] = useState(initialYoutubeUrl);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"twitch" | "youtube" | null>(null);

  async function link(platform: "twitch" | "youtube") {
    setLoading(platform);
    setError(null);
    setMessage(null);
    const channelUrl = platform === "twitch" ? twitchUrl : youtubeUrl;
    const res = await fetch("/api/platform/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, channelUrl }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Failed to link");
      setLoading(null);
      return;
    }
    setMessage(
      platform === "twitch"
        ? `Linked Twitch @${data.login}`
        : `Linked YouTube channel ${data.youtubeChannelId}`
    );
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div>
        <h3 className="font-semibold text-white">Connect platforms</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Link your channel so we can verify live status and auto-end streams when you go offline.
          {twitchLinked && " Twitch linked."}
          {youtubeLinked && " YouTube linked."}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="link-twitch">Twitch channel URL</Label>
        <div className="flex gap-2">
          <Input
            id="link-twitch"
            value={twitchUrl}
            onChange={(e) => setTwitchUrl(e.target.value)}
            placeholder="https://twitch.tv/yourname"
          />
          <Button
            type="button"
            size="sm"
            disabled={loading !== null || !twitchUrl.trim()}
            onClick={() => link("twitch")}
          >
            {loading === "twitch" ? "…" : "Link"}
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="link-youtube">YouTube channel URL</Label>
        <div className="flex gap-2">
          <Input
            id="link-youtube"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/channel/UC…"
          />
          <Button
            type="button"
            size="sm"
            disabled={loading !== null || !youtubeUrl.trim()}
            onClick={() => link("youtube")}
          >
            {loading === "youtube" ? "…" : "Link"}
          </Button>
        </div>
      </div>
      {message && <p className="text-sm text-emerald-400">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
