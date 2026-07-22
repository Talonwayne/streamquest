"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LocationPicker, type LocationValue } from "@/components/location-picker";
import type { UserRole } from "@/types/database";

interface ProfileFormProps {
  initialDisplayName: string;
  initialRole: UserRole;
  initialBio?: string;
  initialPlatformLinks?: {
    twitch?: string;
    youtube?: string;
    kick?: string;
  };
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  initialLocationLabel?: string | null;
}

export function ProfileForm({
  initialDisplayName,
  initialRole,
  initialBio = "",
  initialPlatformLinks = {},
  initialLatitude = null,
  initialLongitude = null,
  initialLocationLabel = null,
}: ProfileFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [bio, setBio] = useState(initialBio);
  const [twitch, setTwitch] = useState(initialPlatformLinks.twitch ?? "");
  const [youtube, setYoutube] = useState(initialPlatformLinks.youtube ?? "");
  const [kick, setKick] = useState(initialPlatformLinks.kick ?? "");
  const [location, setLocation] = useState<LocationValue>({
    latitude: initialLatitude,
    longitude: initialLongitude,
    locationLabel: initialLocationLabel ?? "",
  });
  const [hadLocation] = useState(
    initialLatitude != null && initialLongitude != null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isStreamer = role === "streamer" || role === "both";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const clearLocation =
      isStreamer &&
      hadLocation &&
      location.latitude == null &&
      location.longitude == null;

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        role,
        bio: isStreamer ? bio : undefined,
        platformLinks: isStreamer
          ? { twitch, youtube, kick }
          : undefined,
        ...(isStreamer
          ? {
              latitude: location.latitude,
              longitude: location.longitude,
              locationLabel: location.locationLabel || null,
              clearLocation,
            }
          : {}),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save profile");
    } else {
      setSuccess(true);
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your profile</CardTitle>
        <CardDescription>
          Set your display name and choose whether you are a viewer, streamer, or both.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">I am a...</Label>
            <Select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="viewer">Viewer — I want to request streams</option>
              <option value="streamer">Streamer — I want to fulfill requests</option>
              <option value="both">Both</option>
            </Select>
          </div>

          {isStreamer && (
            <>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell viewers what kind of content you stream..."
                  maxLength={500}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitch">Twitch URL</Label>
                <Input
                  id="twitch"
                  value={twitch}
                  onChange={(e) => setTwitch(e.target.value)}
                  placeholder="https://twitch.tv/yourname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube URL</Label>
                <Input
                  id="youtube"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="https://youtube.com/@yourname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kick">Kick URL</Label>
                <Input
                  id="kick"
                  value={kick}
                  onChange={(e) => setKick(e.target.value)}
                  placeholder="https://kick.com/yourname"
                />
              </div>

              <LocationPicker value={location} onChange={setLocation} />
            </>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && <p className="text-sm text-emerald-400">Profile saved!</p>}

          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
