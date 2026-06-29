"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ClaimButtonProps {
  requestId: string;
}

export function ClaimButton({ requestId }: ClaimButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClaim() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });

    if (res.status === 401) {
      router.push("/auth/login");
      return;
    }

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to claim");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <div>
      <Button onClick={handleClaim} disabled={loading}>
        {loading ? "Claiming..." : "Claim this request"}
      </Button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
