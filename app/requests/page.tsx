import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RequestCard } from "@/components/request-card";
import { CategoryFilter } from "@/components/category-filter";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { computeClientTrendingScore, cn } from "@/lib/utils";
import { parseCategoryParam } from "@/lib/categories";
import { Plus } from "lucide-react";
import type { RequestWithAuthor } from "@/types/database";

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = parseCategoryParam(params.category);
  const activeTag = params.tag?.trim().toLowerCase() ?? null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("requests")
    .select("*, profiles!requests_author_id_fkey(display_name, avatar_url)")
    .order("created_at", { ascending: false });

  if (activeCategory) {
    query = query.eq("category", activeCategory);
  }

  if (activeTag) {
    query = query.contains("tags", [activeTag]);
  }

  const { data: requests } = await query;

  let userUpvotes = new Set<string>();
  if (user && requests?.length) {
    const { data: upvotes } = await supabase
      .from("upvotes")
      .select("request_id")
      .eq("user_id", user.id);
    userUpvotes = new Set(upvotes?.map((u) => u.request_id) ?? []);
  }

  const sorted = [...(requests ?? [])].sort((a, b) => {
    const scoreA = a.trending_score ?? computeClientTrendingScore(a.upvote_count, a.created_at);
    const scoreB = b.trending_score ?? computeClientTrendingScore(b.upvote_count, b.created_at);
    return scoreB - scoreA;
  }) as RequestWithAuthor[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Stream requests</h1>
          <p className="mt-1 text-zinc-400">
            Upvote ideas you want to see. Get notified when a streamer goes live.
          </p>
          {activeTag && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-zinc-500">Filtered by tag:</span>
              <Badge variant="default">#{activeTag}</Badge>
              <Link href="/requests" className="text-xs text-violet-400 hover:underline">
                Clear
              </Link>
            </div>
          )}
        </div>
        <Link href="/requests/new" className={cn(buttonVariants(), "gap-2")}>
          <Plus className="h-4 w-4" />
          New request
        </Link>
      </div>

      <div className="mb-6">
        <CategoryFilter activeCategory={activeCategory} />
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 py-16 text-center">
          <p className="text-zinc-400">
            {activeCategory || activeTag
              ? "No requests match these filters."
              : "No requests yet. Be the first to post one!"}
          </p>
          <Link href="/requests/new" className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex")}>
            Create a request
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              userUpvoted={userUpvotes.has(request.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
