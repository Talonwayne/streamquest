import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/category-badge";
import { RequestTags } from "@/components/request-tags";
import { UpvoteButton } from "@/components/upvote-button";
import { GoLiveForm } from "@/components/go-live-form";
import { formatRelativeTime, formatRequestStatus } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import type { LiveSessionWithStreamer, RequestStatus } from "@/types/database";

const statusVariant = {
  open: "default" as const,
  live_now: "warning" as const,
  completed: "success" as const,
};

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: request } = await supabase
    .from("requests")
    .select(
      `
      *,
      profiles!requests_author_id_fkey(display_name, avatar_url),
      live_sessions(
        id,
        streamer_id,
        stream_url,
        platform,
        started_at,
        ended_at,
        profiles!live_sessions_streamer_id_fkey(
          display_name,
          avatar_url,
          streamer_profiles(bio, platform_links)
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (!request) notFound();

  let userUpvoted = false;
  if (user) {
    const { data: upvote } = await supabase
      .from("upvotes")
      .select("request_id")
      .eq("request_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    userUpvoted = !!upvote;
  }

  let isStreamer = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isStreamer = profile?.role === "streamer" || profile?.role === "both";
  }

  const liveSessions = ((request.live_sessions ?? []) as LiveSessionWithStreamer[]).sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );
  const activeSessions = liveSessions.filter((s) => !s.ended_at);
  const userActiveSession = user
    ? activeSessions.find((s) => s.streamer_id === user.id)
    : null;
  const canGoLive =
    isStreamer &&
    user &&
    (request.status === "open" || request.status === "live_now") &&
    !userActiveSession;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6">
        <Link href="/requests" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Back to requests
        </Link>
      </div>

      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant[request.status as RequestStatus]}>
                {formatRequestStatus(request.status as RequestStatus)}
              </Badge>
              <CategoryBadge category={request.category} />
              <span className="text-sm text-zinc-500">
                {formatRelativeTime(request.created_at)}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white">{request.title}</h1>
            <p className="mt-1 text-sm text-zinc-500">
              by {request.profiles?.display_name ?? "Anonymous"}
            </p>
            <RequestTags tags={request.tags ?? []} linkToBrowse className="mt-2" />
          </div>
          <UpvoteButton
            key={`${request.id}-${request.upvote_count}-${userUpvoted}`}
            requestId={request.id}
            initialCount={request.upvote_count}
            initialUpvoted={userUpvoted}
            disabled={request.status === "completed"}
            disabledReason={request.status === "completed" ? "Request completed" : undefined}
          />
        </div>

        <p className="text-zinc-300 leading-relaxed">{request.description}</p>

        {canGoLive && (
          <div className="rounded-xl border border-violet-800/30 bg-violet-950/20 p-6">
            <h2 className="mb-2 font-semibold text-violet-200">Ready to stream?</h2>
            <p className="mb-4 text-sm text-zinc-400">
              Go live on this request. All upvoters get notified — multiple streamers can fulfill the same request.
            </p>
            <GoLiveForm requestId={request.id} requestTitle={request.title} />
          </div>
        )}

        {activeSessions.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-emerald-300">
              Live now ({activeSessions.length})
            </h2>
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-xl border border-emerald-800/50 bg-emerald-950/20 p-6"
              >
                <Link
                  href={`/streamers/${session.streamer_id}`}
                  className="font-medium text-violet-400 hover:underline"
                >
                  {session.profiles?.display_name ?? "Streamer"}
                </Link>
                <p className="mt-1 text-sm text-zinc-400">
                  Started {formatRelativeTime(session.started_at)} on {session.platform}
                </p>
                <a
                  href={session.stream_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex"
                >
                  <Button className="gap-2">
                    Watch stream
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            ))}
          </div>
        )}

        {liveSessions.filter((s) => s.ended_at).length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-zinc-400">Past sessions</h2>
            {liveSessions
              .filter((s) => s.ended_at)
              .map((session) => (
                <div
                  key={session.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
                >
                  <Link
                    href={`/streamers/${session.streamer_id}`}
                    className="text-sm text-violet-400 hover:underline"
                  >
                    {session.profiles?.display_name ?? "Streamer"}
                  </Link>
                  <p className="mt-1 text-xs text-zinc-500">
                    {formatRelativeTime(session.started_at)} · {session.platform}
                  </p>
                  <a
                    href={session.stream_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-zinc-400 hover:text-violet-300"
                  >
                    View stream link →
                  </a>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
