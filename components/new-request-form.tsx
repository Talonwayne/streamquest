"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { CATEGORY_LABELS, REQUEST_CATEGORIES } from "@/lib/categories";
import type { RequestCategory, SimilarRequest } from "@/types/database";

export function NewRequestForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RequestCategory>("other");
  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [similarRequests, setSimilarRequests] = useState<SimilarRequest[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [forceSubmit, setForceSubmit] = useState(false);

  async function checkDuplicates(): Promise<SimilarRequest[]> {
    const params = new URLSearchParams({ title, tags: tagsInput });
    const res = await fetch(`/api/requests/similar?${params.toString()}`);
    if (!res.ok) return [];

    const data = await res.json();
    return data.similar ?? [];
  }

  async function createRequest() {
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, category, tags: tagsInput }),
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
          Describe what you want to watch. Pick a category and add tags so others can find similar requests.
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
              placeholder="Blindfolded Mario 64 speedrun"
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
              placeholder="Describe the stream idea in detail so streamers know what to do..."
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
              placeholder="mario, speedrun, blindfold (comma-separated)"
            />
            <p className="text-xs text-zinc-500">
              Lowercase letters, numbers, and hyphens only. Up to 10 tags.
            </p>
          </div>

          {showDuplicateWarning && similarRequests.length > 0 && (
            <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-4">
              <p className="text-sm font-medium text-amber-200">
                Similar requests already exist
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                You can still post if your idea is different.
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
