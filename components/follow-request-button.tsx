"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";

interface FollowRequestButtonProps {
  requestId: string;
  initialFollowing: boolean;
  isLoggedIn: boolean;
}

export function FollowRequestButton({
  requestId,
  initialFollowing,
  isLoggedIn,
}: FollowRequestButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    setLoading(true);
    try {
      if (following) {
        const res = await fetch(`/api/follows?requestId=${requestId}`, {
          method: "DELETE",
        });
        if (res.ok) setFollowing(false);
      } else {
        const res = await fetch("/api/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId }),
        });
        if (res.ok) setFollowing(true);
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={following ? "secondary" : "outline"}
      onClick={toggle}
      disabled={loading}
      className="gap-1.5"
    >
      {following ? (
        <>
          <BellOff className="h-3.5 w-3.5" />
          Following
        </>
      ) : (
        <>
          <Bell className="h-3.5 w-3.5" />
          Follow
        </>
      )}
    </Button>
  );
}
