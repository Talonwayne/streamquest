"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Flag } from "lucide-react";

interface ReportButtonProps {
  requestId: string;
  isLoggedIn: boolean;
}

export function ReportButton({ requestId, isLoggedIn }: ReportButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, reason }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Failed to submit report");
      setLoading(false);
      return;
    }
    setDone(true);
    setLoading(false);
    setOpen(false);
  }

  if (done) {
    return <p className="text-xs text-zinc-500">Report submitted. Thanks.</p>;
  }

  return (
    <div>
      {!open ? (
        <button
          type="button"
          onClick={() => {
            if (!isLoggedIn) {
              router.push("/auth/login");
              return;
            }
            setOpen(true);
          }}
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
        >
          <Flag className="h-3 w-3" />
          Report
        </button>
      ) : (
        <form onSubmit={submit} className="mt-2 space-y-2 rounded-lg border border-zinc-800 p-3">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you reporting this request?"
            rows={3}
            required
            minLength={3}
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading || reason.trim().length < 3}>
              {loading ? "Sending…" : "Submit report"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
