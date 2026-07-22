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
  defaultLatitude?: number | null;
  defaultLongitude?: number | null;
  defaultLocationLabel?: string | null;
}

export function GoLiveForm({
  requestId,
  requestTitle,
  defaultLatitude = null,
  defaultLongitude = null,
  defaultLocationLabel = null,
}: GoLiveFormProps) {
  const router = useRouter();
  const [streamUrl, setStreamUrl] = useState("");
  const [shareLocation, setShareLocation] = useState(
    defaultLatitude != null && defaultLongitude != null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasDefaultLocation =
    defaultLatitude != null && defaultLongitude != null;

  const preview = useMemo(() => {
    if (!streamUrl.trim()) return null;
    return validateStreamUrl(streamUrl);
  }, [streamUrl]);

  const detectedPlatform = preview?.valid
    ? preview.platform
    : detectPlatform(streamUrl);

  async function resolveLocation(): Promise<{
    latitude?: number;
    longitude?: number;
    locationLabel?: string | null;
  }> {
    if (!shareLocation) return {};

    if (hasDefaultLocation) {
      return {
        latitude: defaultLatitude!,
        longitude: defaultLongitude!,
        locationLabel: defaultLocationLabel,
      };
    }

    if (!navigator.geolocation) {
      throw new Error(
        "No saved location and geolocation is unavailable. Set a location on your profile first."
      );
    }

    const coords = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 12000,
      });
    });

    return {
      latitude: coords.coords.latitude,
      longitude: coords.coords.longitude,
      locationLabel: defaultLocationLabel,
    };
  }

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

    let locationFields: {
      latitude?: number;
      longitude?: number;
      locationLabel?: string | null;
    } = {};

    if (shareLocation) {
      try {
        locationFields = await resolveLocation();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not get location. Set one on your profile or uncheck sharing."
        );
        setLoading(false);
        return;
      }
    }

    const res = await fetch("/api/go-live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        streamUrl: validation.normalizedUrl ?? streamUrl.trim(),
        platform: validation.platform,
        shareLocation,
        ...locationFields,
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

          <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={shareLocation}
                onChange={(e) => setShareLocation(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-violet-500 focus:ring-violet-500"
              />
              <span>
                <span className="block text-sm font-medium text-zinc-200">
                  Share my location on the map
                </span>
                <span className="mt-0.5 block text-xs text-zinc-500">
                  Location is public when shared. Uses your profile location
                  {hasDefaultLocation && defaultLocationLabel
                    ? ` (${defaultLocationLabel})`
                    : ""}
                  {hasDefaultLocation
                    ? "."
                    : ", or asks the browser for your current position."}
                </span>
              </span>
            </label>
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
