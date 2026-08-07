import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/category-badge";
import { RequestTags } from "@/components/request-tags";
import { UpvoteButton } from "@/components/upvote-button";
import { GoLiveForm } from "@/components/go-live-form";
import { StreamLinksList } from "@/components/stream-links-list";
import { CommentsSection } from "@/components/comments-section";
import { FollowRequestButton } from "@/components/follow-request-button";
import { ReportButton } from "@/components/report-button";
import { formatRelativeTime, formatRequestStatus, unwrapRelation } from "@/lib/utils";
import type { CommentWithAuthor, LiveSessionWithStreamer, RequestStatus } from "@/types/database";

const statusVariant = {
  open: "default" as const,
  live_now: "warning" as const,
  completed: "success" as const,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("requests")
    .select("title, description, category")
    .eq("id", id)
    .maybeSingle();

  if (!data) return { title: "Request" };

  return {
    title: data.title,
    description: data.description.slice(0, 160),
    openGraph: {
      title: data.title,
      description: data.description.slice(0, 160),
      type: "article",
    },
  };
}

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
        platform_title,
        platform_viewer_count,
        live_verified,
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
  let userFollowing = false;
  if (user) {
    const { data: upvote } = await supabase
      .from("upvotes")
      .select("request_id")
      .eq("request_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    userUpvoted = !!upvote;

    const { data: follow } = await supabase
      .from("request_follows")
      .select("request_id")
      .eq("request_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    userFollowing = !!follow;
  }

  const { data: commentsData } = await supabase
    .from("comments")
    .select(
      `
      id,
      request_id,
      author_id,
      body,
      created_at,
      profiles!comments_author_id_fkey ( display_name, avatar_url )
    `
    )
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  const comments = (commentsData ?? []).map((c) => ({
    ...c,
    profiles: unwrapRelation(c.profiles),
  })) as CommentWithAuthor[];

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
            {request.location_label && (
              <p className="mt-1 text-sm text-zinc-500">📍 {request.location_label}</p>
            )}
            <RequestTags tags={request.tags ?? []} linkToBrowse className="mt-2" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <UpvoteButton
              key={`${request.id}-${request.upvote_count}-${userUpvoted}`}
              requestId={request.id}
              initialCount={request.upvote_count}
              initialUpvoted={userUpvoted}
              disabled={request.status === "completed"}
              disabledReason={request.status === "completed" ? "Request completed" : undefined}
            />
            <FollowRequestButton
              requestId={request.id}
              initialFollowing={userFollowing}
              isLoggedIn={!!user}
            />
          </div>
        </div>

        <p className="text-zinc-300 leading-relaxed">{request.description}</p>

        <ReportButton requestId={request.id} isLoggedIn={!!user} />

        {canPostStreamLink && (
          <div className="rounded-xl border border-violet-800/30 bg-violet-950/20 p-6">
            <h2 className="mb-2 font-semibold text-violet-200">Fulfill this request</h2>
            <p className="mb-4 text-sm text-zinc-400">
              Post your stream link. Upvoters and followers get notified — multiple people can
              fulfill the same request.
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
              to upvote, follow, comment, or post a stream link.
            </p>
          </div>
        )}

        {activeSessions.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-emerald-300">
              Stream links ({activeSessions.length} live)
            </h2>
            <StreamLinksList
              sessions={activeSessions}
              variant="active"
              currentUserId={user?.id}
            />
          </div>
        )}

        {pastSessions.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-zinc-400">Past stream links</h2>
            <StreamLinksList sessions={pastSessions} variant="past" />
          </div>
        )}

        <CommentsSection
          requestId={request.id}
          initialComments={comments}
          isLoggedIn={!!user}
          currentUserId={user?.id ?? null}
        />
      </div>
    </div>
  );
}
