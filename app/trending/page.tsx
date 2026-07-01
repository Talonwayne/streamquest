import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TrendingCard } from "@/components/trending-card";
import { buttonVariants } from "@/components/ui/button";
import { cn, computeClientTrendingScore } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import type { TrendingRequest } from "@/types/database";

export default async function TrendingPage() {
  const supabase = await createClient();

  const { data: requests, error } = await supabase
    .from("requests")
    .select(
      "*, profiles!requests_author_id_fkey(display_name, avatar_url)"
    )
    .order("trending_score", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Trending query failed:", error.message);
  }

  const ranked = [...(requests ?? [])]
    .map((request) => ({
      ...request,
      trending_score:
        request.trending_score ??
        computeClientTrendingScore(request.upvote_count, request.created_at),
      active_streamer_count: request.active_streamer_count ?? 0,
    }))
    .sort((a, b) => b.trending_score - a.trending_score) as TrendingRequest[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-800/50 bg-violet-950/30 px-3 py-1 text-xs text-violet-300">
          <TrendingUp className="h-3.5 w-3.5" />
          Velocity-based ranking
        </div>
        <h1 className="text-3xl font-bold text-white">Trending</h1>
        <p className="mt-1 text-zinc-400">
          Topics gaining momentum right now — ranked by recent upvotes, live activity, and
          engagement decay. Not total upvotes.
        </p>
      </div>

      {ranked.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 py-16 text-center">
          <p className="text-zinc-400">Nothing trending yet. Upvote requests or go live to spark momentum.</p>
          <Link href="/requests" className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex")}>
            Browse requests
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {ranked.map((request, index) => (
            <TrendingCard key={request.id} request={request} rank={index + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
