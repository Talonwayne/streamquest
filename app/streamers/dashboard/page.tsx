import Link from "next/link";
import { requireStreamer } from "@/lib/auth";
import { RequestCard } from "@/components/request-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime, formatRequestStatus, trendingScore, unwrapRelation } from "@/lib/utils";
import type { RequestStatus, RequestWithAuthor } from "@/types/database";

export default async function StreamerDashboardPage() {
  const { supabase, user } = await requireStreamer();

  const { data: openRequests } = await supabase
    .from("requests")
    .select("*, profiles!requests_author_id_fkey(display_name, avatar_url)")
    .in("status", ["open", "live_now"])
    .order("upvote_count", { ascending: false });

  const sortedOpen = [...(openRequests ?? [])].sort(
    (a, b) =>
      trendingScore(b.upvote_count, b.created_at) -
      trendingScore(a.upvote_count, a.created_at)
  ) as RequestWithAuthor[];

  const { data: mySessions } = await supabase
    .from("live_sessions")
    .select(
      `
      id,
      request_id,
      stream_url,
      platform,
      started_at,
      ended_at,
      requests(id, title, status, upvote_count)
    `
    )
    .eq("streamer_id", user.id)
    .order("started_at", { ascending: false });

  const activeSessions = (mySessions ?? []).filter((s) => !s.ended_at);

  const statusVariant = {
    open: "default" as const,
    live_now: "warning" as const,
    completed: "success" as const,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Streamer dashboard</h1>
        <p className="mt-1 text-zinc-400">
          Browse what viewers want to watch. Go live on requests and grow your audience.
        </p>
      </div>

      {activeSessions.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-white">Your live sessions</h2>
          <div className="space-y-4">
            {activeSessions.map((session) => {
              const req = unwrapRelation(session.requests);

              return (
                <Card key={session.id}>
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
                      <Badge variant={statusVariant[(req?.status ?? "open") as RequestStatus]}>
                        {formatRequestStatus((req?.status ?? "open") as RequestStatus)}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Live since {formatRelativeTime(session.started_at)} · {req?.upvote_count} upvotes
                    </p>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={session.stream_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-violet-400 hover:underline"
                    >
                      View live session →
                    </a>
                  </CardContent>
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
