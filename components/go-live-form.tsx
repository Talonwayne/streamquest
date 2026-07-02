"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  detectPlatform,
  STREAM_PLATFORM_LABELS,
  validateStreamUrl,
} from "@/lib/stream-links";

interface GoLiveFormProps {
  requestId: string;
  requestTitle: string;
}

export function GoLiveForm({ requestId, requestTitle }: GoLiveFormProps) {
  const router = useRouter();
  const [streamUrl, setStreamUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const preview = useMemo(() => {
    if (!streamUrl.trim()) return null;
    return validateStreamUrl(streamUrl);
  }, [streamUrl]);

  const detectedPlatform = preview?.valid
    ? preview.platform
    : detectPlatform(streamUrl);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const validation = validateStreamUrl(streamUrl);
    if (!validation.valid) {
      setError(validation.error ?? "Invalid stream link");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/go-live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        streamUrl: validation.normalizedUrl ?? streamUrl.trim(),
        platform: validation.platform,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to post stream link");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setStreamUrl("");
    router.refresh();
    setLoading(false);
  }

  if (success) {
    return (
      <Card className="border-emerald-800/50 bg-emerald-950/20">
        <CardContent className="pt-6">
          <p className="text-emerald-300">
            Stream link posted! Everyone who requested or upvoted &ldquo;
            {requestTitle}&rdquo; has been notified.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => setSuccess(false)}
          >
            Post another link
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post stream link</CardTitle>
        <CardDescription>
          Paste your live stream URL to fulfill this request. Supported: Twitch,
          YouTube, Kick, TikTok, Instagram, and Facebook.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="streamUrl">Stream URL</Label>
            <Input
              id="streamUrl"
              type="url"
              value={streamUrl}
              onChange={(e) => {
                setStreamUrl(e.target.value);
                setError(null);
              }}
              placeholder="https://twitch.tv/yourname"
              required
            />
            {detectedPlatform && detectedPlatform !== "other" && (
              <p className="text-sm text-zinc-400">
                Detected: {STREAM_PLATFORM_LABELS[detectedPlatform]}
              </p>
            )}
            {preview && !preview.valid && streamUrl.trim() && (
              <p className="text-sm text-amber-400">{preview.error}</p>
            )}
            {preview?.valid && (
              <p className="text-sm text-emerald-400">
                Valid {STREAM_PLATFORM_LABELS[preview.platform]} link
              </p>
            )}
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button
            type="submit"
            disabled={loading || !(preview?.valid ?? false)}
            className="w-full"
          >
            {loading ? "Posting..." : "Fulfill this request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
