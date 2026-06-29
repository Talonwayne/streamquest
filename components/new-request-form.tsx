"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function NewRequestForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request a stream</CardTitle>
        <CardDescription>
          Describe what you want to watch. Streamers can claim your idea and you will get notified when they go live.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
