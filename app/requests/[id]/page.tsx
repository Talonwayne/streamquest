import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/category-badge";
import { RequestTags } from "@/components/request-tags";
import { UpvoteButton } from "@/components/upvote-button";
import { GoLiveForm } from "@/components/go-live-form";
import { StreamLinksList } from "@/components/stream-links-list";
import { formatRelativeTime, formatRequestStatus } from "@/lib/utils";
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

  const liveSessions = ((request.live_sessions ?? []) as LiveSessionWithStreamer[]).sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );
  const activeSessions = liveSessions.filter((s) => !s.ended_at);
  const pastSessions = liveSessions.filter((s) => s.ended_at);
  const userActiveSession = user
    ? activeSessions.find((s) => s.streamer_id === user.id)
    : null;

  let canPostStreamLink = false;
  let defaultLatitude: number | null = null;
  let defaultLongitude: number | null = null;
  let defaultLocationLabel: string | null = null;

  if (user) {
    canPostStreamLink =
      (request.status === "open" || request.status === "live_now") &&
      !userActiveSession;

    if (canPostStreamLink) {
      const { data: streamerProfile } = await supabase
        .from("streamer_profiles")
        .select("latitude, longitude, location_label")
        .eq("user_id", user.id)
        .maybeSingle();
      defaultLatitude = streamerProfile?.latitude ?? null;
      defaultLongitude = streamerProfile?.longitude ?? null;
      defaultLocationLabel = streamerProfile?.location_label ?? null;
    }
  }

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

        {canPostStreamLink && (
          <div className="rounded-xl border border-violet-800/30 bg-violet-950/20 p-6">
            <h2 className="mb-2 font-semibold text-violet-200">Fulfill this request</h2>
            <p className="mb-4 text-sm text-zinc-400">
              Post your stream link. All upvoters get notified — multiple people can fulfill the same request.
            </p>
            <GoLiveForm
              requestId={request.id}
              requestTitle={request.title}
              defaultLatitude={defaultLatitude}
              defaultLongitude={defaultLongitude}
              defaultLocationLabel={defaultLocationLabel}
            />
          </div>
        )}

        {!user && (request.status === "open" || request.status === "live_now") && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
            <p className="text-sm text-zinc-400">
              <Link href="/auth/login" className="text-violet-400 hover:underline">
                Sign in
              </Link>{" "}
              to post a stream link and fulfill this request.
            </p>
          </div>
        )}

        {activeSessions.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-emerald-300">
              Stream links ({activeSessions.length} live)
            </h2>
            <StreamLinksList sessions={activeSessions} variant="active" />
          </div>
        )}

        {pastSessions.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-zinc-400">Past stream links</h2>
            <StreamLinksList sessions={pastSessions} variant="past" />
          </div>
        )}
      </div>
    </div>
  );
}
