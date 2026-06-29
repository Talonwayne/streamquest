import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RequestCard } from "@/components/request-card";
import { buttonVariants } from "@/components/ui/button";
import { trendingScore, cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import type { RequestWithAuthor } from "@/types/database";

export default async function RequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: requests } = await supabase
    .from("requests")
    .select("*, profiles(display_name, avatar_url)")
    .order("created_at", { ascending: false });

  let userUpvotes = new Set<string>();
  if (user && requests?.length) {
    const { data: upvotes } = await supabase
      .from("upvotes")
      .select("request_id")
      .eq("user_id", user.id);
    userUpvotes = new Set(upvotes?.map((u) => u.request_id) ?? []);
  }

  const sorted = [...(requests ?? [])].sort(
    (a, b) =>
      trendingScore(b.upvote_count, b.created_at) -
      trendingScore(a.upvote_count, a.created_at)
  ) as RequestWithAuthor[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Stream requests</h1>
          <p className="mt-1 text-zinc-400">
            Upvote ideas you want to see. Get notified when a streamer goes live.
          </p>
        </div>
        <Link href="/requests/new" className={cn(buttonVariants(), "gap-2")}>
          <Plus className="h-4 w-4" />
          New request
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 py-16 text-center">
          <p className="text-zinc-400">No requests yet. Be the first to post one!</p>
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
