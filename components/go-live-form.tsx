"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StreamPlatform } from "@/types/database";

interface GoLiveFormProps {
  requestId: string;
  requestTitle: string;
}

export function GoLiveForm({ requestId, requestTitle }: GoLiveFormProps) {
  const router = useRouter();
  const [streamUrl, setStreamUrl] = useState("");
  const [platform, setPlatform] = useState<StreamPlatform>("twitch");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/go-live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, streamUrl, platform }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to go live");
      setLoading(false);
      return;
    }

    setSuccess(true);
    router.refresh();
    setLoading(false);
  }

  if (success) {
    return (
      <Card className="border-emerald-800/50 bg-emerald-950/20">
        <CardContent className="pt-6">
          <p className="text-emerald-300">
            You are live! Everyone who requested or upvoted &ldquo;{requestTitle}&rdquo; has been notified.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Go live</CardTitle>
        <CardDescription>
          Paste your stream URL. All requesters and upvoters will be notified.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select
              id="platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as StreamPlatform)}
            >
              <option value="twitch">Twitch</option>
              <option value="youtube">YouTube</option>
              <option value="kick">Kick</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="streamUrl">Stream URL</Label>
            <Input
              id="streamUrl"
              type="url"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="https://twitch.tv/yourname"
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Notifying viewers..." : "Go live & notify"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
