import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UpvoteButton } from "@/components/upvote-button";
import { ClaimButton } from "@/components/claim-button";
import { GoLiveForm } from "@/components/go-live-form";
import { formatRelativeTime } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

const statusVariant = {
  open: "default" as const,
  claimed: "warning" as const,
  fulfilled: "success" as const,
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
      profiles(display_name, avatar_url),
      claims(
        id,
        streamer_id,
        claimed_at,
        profiles(display_name, avatar_url),
        streamer_profiles(bio, platform_links),
        live_sessions(id, stream_url, platform, started_at)
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

  const claim = request.claims?.[0] ?? null;
  const liveSession = claim?.live_sessions?.[0] ?? null;
  const isClaimOwner = user && claim?.streamer_id === user.id;

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
            <div className="mb-2 flex items-center gap-2">
              <Badge variant={statusVariant[request.status as keyof typeof statusVariant]}>
                {request.status}
              </Badge>
              <span className="text-sm text-zinc-500">
                {formatRelativeTime(request.created_at)}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white">{request.title}</h1>
            <p className="mt-1 text-sm text-zinc-500">
              by {request.profiles?.display_name ?? "Anonymous"}
            </p>
          </div>
          <UpvoteButton
            requestId={request.id}
            initialCount={request.upvote_count}
            initialUpvoted={userUpvoted}
            disabled={request.status === "fulfilled"}
          />
        </div>

        <p className="text-zinc-300 leading-relaxed">{request.description}</p>

        {request.status === "open" && isStreamer && (
          <div className="rounded-xl border border-violet-800/30 bg-violet-950/20 p-6">
            <h2 className="mb-2 font-semibold text-violet-200">Streamer?</h2>
            <p className="mb-4 text-sm text-zinc-400">
              Claim this request and go live when you are ready. All upvoters get notified.
            </p>
            <ClaimButton requestId={request.id} />
          </div>
        )}

        {claim && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="font-semibold text-white">Claimed by</h2>
            <Link
              href={`/streamers/${claim.streamer_id}`}
              className="mt-1 text-violet-400 hover:underline"
            >
              {claim.profiles?.display_name ?? "Streamer"}
            </Link>
            <p className="mt-1 text-sm text-zinc-500">
              Claimed {formatRelativeTime(claim.claimed_at)}
            </p>
          </div>
        )}

        {isClaimOwner && request.status === "claimed" && !liveSession && (
          <GoLiveForm claimId={claim!.id} requestTitle={request.title} />
        )}

        {liveSession && (
          <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/20 p-6">
            <h2 className="font-semibold text-emerald-300">Live session</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Started {formatRelativeTime(liveSession.started_at)} on{" "}
              {liveSession.platform}
            </p>
            <a
              href={liveSession.stream_url}
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
        )}
      </div>
    </div>
  );
}
