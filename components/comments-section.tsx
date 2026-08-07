"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeTime } from "@/lib/utils";
import type { CommentWithAuthor } from "@/types/database";

interface CommentsSectionProps {
  requestId: string;
  initialComments: CommentWithAuthor[];
  isLoggedIn: boolean;
  currentUserId: string | null;
}

export function CommentsSection({
  requestId,
  initialComments,
  isLoggedIn,
  currentUserId,
}: CommentsSectionProps) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Failed to post comment");
      setLoading(false);
      return;
    }
    setComments((prev) => [...prev, data as CommentWithAuthor]);
    setBody("");
    setLoading(false);
    router.refresh();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-white">
        Comments ({comments.length})
      </h2>

      {comments.length === 0 && (
        <p className="text-sm text-zinc-500">No comments yet. Start the conversation.</p>
      )}

      <ul className="space-y-3">
        {comments.map((comment) => (
          <li
            key={comment.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-zinc-300">
                {comment.profiles?.display_name ?? "Anonymous"}
              </span>
              <span className="text-xs text-zinc-500">
                {formatRelativeTime(comment.created_at)}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">{comment.body}</p>
            {currentUserId === comment.author_id && (
              <button
                type="button"
                onClick={() => remove(comment.id)}
                className="mt-2 text-xs text-zinc-500 hover:text-red-400"
              >
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>

      {isLoggedIn ? (
        <form onSubmit={submit} className="space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            rows={3}
            maxLength={2000}
            required
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" size="sm" disabled={loading || !body.trim()}>
            {loading ? "Posting…" : "Post comment"}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-zinc-500">
          <Link href="/auth/login" className="text-violet-400 hover:underline">
            Sign in
          </Link>{" "}
          to comment.
        </p>
      )}
    </div>
  );
}
