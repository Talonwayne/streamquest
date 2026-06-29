import Link from "next/link";
import { requireStreamer } from "@/lib/auth";
import { RequestCard } from "@/components/request-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoLiveForm } from "@/components/go-live-form";
import { formatRelativeTime, trendingScore, unwrapRelation } from "@/lib/utils";
import type { RequestWithAuthor } from "@/types/database";

export default async function StreamerDashboardPage() {
  const { supabase, user } = await requireStreamer();

  const { data: openRequests } = await supabase
    .from("requests")
    .select("*, profiles(display_name, avatar_url)")
    .eq("status", "open")
    .order("upvote_count", { ascending: false });

  const sortedOpen = [...(openRequests ?? [])].sort(
    (a, b) =>
      trendingScore(b.upvote_count, b.created_at) -
      trendingScore(a.upvote_count, a.created_at)
  ) as RequestWithAuthor[];

  const { data: myClaims } = await supabase
    .from("claims")
    .select(
      `
      id,
      claimed_at,
      requests(id, title, status, upvote_count),
      live_sessions(id, stream_url, platform, started_at)
    `
    )
    .eq("streamer_id", user.id)
    .order("claimed_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Streamer dashboard</h1>
        <p className="mt-1 text-zinc-400">
          Browse what viewers want to watch. Claim a request, go live, and grow your audience.
        </p>
      </div>

      {myClaims && myClaims.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-white">Your claims</h2>
          <div className="space-y-4">
            {myClaims.map((claim) => {
              const req = unwrapRelation(claim.requests);
              const live = claim.live_sessions?.[0] ?? null;

              return (
                <Card key={claim.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        <Link
                          href={`/requests/${req?.id}`}
                          className="hover:text-violet-400"
                        >
                          {req?.title}
                        </Link>
                      </CardTitle>
                      <Badge
                        variant={
                          req?.status === "fulfilled"
                            ? "success"
                            : req?.status === "claimed"
                              ? "warning"
                              : "default"
                        }
                      >
                        {req?.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Claimed {formatRelativeTime(claim.claimed_at)} · {req?.upvote_count} upvotes
                    </p>
                  </CardHeader>
                  {req?.status === "claimed" && !live && (
                    <CardContent>
                      <GoLiveForm claimId={claim.id} requestTitle={req.title} />
                    </CardContent>
                  )}
                  {live && (
                    <CardContent>
                      <a
                        href={live.stream_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-violet-400 hover:underline"
                      >
                        View live session →
                      </a>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-semibold text-white">Open requests</h2>
        {sortedOpen.length === 0 ? (
          <p className="text-zinc-400">No open requests right now. Check back soon!</p>
        ) : (
          <div className="space-y-4">
            {sortedOpen.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
