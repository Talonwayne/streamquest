"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface EndStreamButtonProps {
  sessionId: string;
}

export function EndStreamButton({ sessionId }: EndStreamButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnd() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/end-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liveSessionId: sessionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to end stream");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to end stream");
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleEnd}
        disabled={loading}
      >
        {loading ? "Ending…" : "End stream"}
      </Button>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
