"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { CATEGORY_LABELS, REQUEST_CATEGORIES, isValidCategory } from "@/lib/categories";
import type { RequestCategory, SimilarRequest } from "@/types/database";

const LOCATION_CATEGORIES = new Set<RequestCategory>([
  "travel",
  "irl",
  "investigative_journalism",
  "events",
]);

function initialCategory(param: string | null): RequestCategory {
  return param && isValidCategory(param) ? param : "other";
}

export function NewRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState(searchParams.get("title") ?? "");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RequestCategory>(() =>
    initialCategory(searchParams.get("category"))
  );
  const [tagsInput, setTagsInput] = useState(searchParams.get("tags") ?? "");
  const [location, setLocation] = useState<LocationValue>({
    latitude: null,
    longitude: null,
    locationLabel: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [similarRequests, setSimilarRequests] = useState<SimilarRequest[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [forceSubmit, setForceSubmit] = useState(false);

  const showLocation = LOCATION_CATEGORIES.has(category);

  async function checkDuplicates(): Promise<SimilarRequest[]> {
    const params = new URLSearchParams({ title, tags: tagsInput });
    const res = await fetch(`/api/requests/similar?${params.toString()}`);
    if (!res.ok) return [];

    const data = await res.json();
    return data.similar ?? [];
  }

  async function createRequest() {
    const payload: Record<string, unknown> = {
      title,
      description,
      category,
      tags: tagsInput,
    };
    if (showLocation && location.latitude != null && location.longitude != null) {
      payload.latitude = location.latitude;
      payload.longitude = location.longitude;
      payload.locationLabel = location.locationLabel || null;
    }

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      router.push("/auth/login");
      return;
    }

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create request");
      setLoading(false);
      return;
    }

    const data = await res.json();
    router.push(`/requests/${data.id}`);
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!forceSubmit) {
      const similar = await checkDuplicates();
      if (similar.length > 0) {
        setSimilarRequests(similar);
        setShowDuplicateWarning(true);
        setLoading(false);
        return;
      }
    }

    await createRequest();
  }

  async function handlePostAnyway() {
    setForceSubmit(true);
    setShowDuplicateWarning(false);
    setLoading(true);
    setError(null);
    await createRequest();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request a stream</CardTitle>
        <CardDescription>
          Describe what you want to watch. Pick a category and add tags so others can find similar
          requests. Journalism and travel can pin a place on the map.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setForceSubmit(false);
                setShowDuplicateWarning(false);
              }}
              placeholder="Live FOIA walkthrough for city hall records"
              required
              minLength={3}
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the stream idea in detail so creators know what to do..."
              required
              minLength={10}
              maxLength={2000}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as RequestCategory)}
              required
            >
              {REQUEST_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {CATEGORY_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => {
                setTagsInput(e.target.value);
                setForceSubmit(false);
                setShowDuplicateWarning(false);
              }}
              placeholder="foia, local-government, transparency"
            />
            <p className="text-xs text-zinc-500">
              Lowercase letters, numbers, and hyphens only. Up to 10 tags.
            </p>
          </div>

          {showLocation && (
            <div className="space-y-2 rounded-lg border border-zinc-800 p-4">
              <Label>Place (optional — shows on the map)</Label>
              <p className="text-xs text-zinc-500">
                Prefer a city or neighborhood, not a precise home address.
              </p>
              <LocationPicker value={location} onChange={setLocation} idPrefix="request-loc" />
            </div>
          )}

          {showDuplicateWarning && similarRequests.length > 0 && (
            <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-4">
              <p className="text-sm font-medium text-amber-200">
                Similar requests already exist
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Prefer upvoting or commenting on an existing ask when it&apos;s the same idea.
              </p>
              <ul className="mt-3 space-y-2">
                {similarRequests.map((similar) => (
                  <li key={similar.id} className="text-sm">
                    <Link
                      href={`/requests/${similar.id}`}
                      className="text-violet-400 hover:underline"
                      target="_blank"
                    >
                      {similar.title}
                    </Link>
                    <span className="ml-2 text-xs text-zinc-500">
                      ({similar.match_reason.replaceAll("_", " ")})
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handlePostAnyway}>
                  Post anyway
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDuplicateWarning(false)}
                >
                  Edit request
                </Button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Posting..." : "Post request"}
            </Button>
            <Link href="/requests" className={cn(buttonVariants({ variant: "outline" }))}>
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
