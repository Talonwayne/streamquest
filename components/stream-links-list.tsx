import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EndStreamButton } from "@/components/end-stream-button";
import { formatRelativeTime } from "@/lib/utils";
import { STREAM_PLATFORM_LABELS } from "@/lib/stream-links";
import type { LiveSessionWithStreamer } from "@/types/database";

const PLATFORM_COLORS: Record<string, string> = {
  twitch: "bg-purple-900/60 text-purple-200 border-purple-700/50",
  youtube: "bg-red-900/60 text-red-200 border-red-700/50",
  kick: "bg-lime-900/60 text-lime-200 border-lime-700/50",
  tiktok: "bg-zinc-800 text-zinc-100 border-zinc-600",
  instagram: "bg-pink-900/60 text-pink-200 border-pink-700/50",
  facebook: "bg-blue-900/60 text-blue-200 border-blue-700/50",
  other: "bg-zinc-800 text-zinc-200 border-zinc-600",
};

function PlatformBadge({ platform }: { platform: string }) {
  const label = STREAM_PLATFORM_LABELS[platform as keyof typeof STREAM_PLATFORM_LABELS] ?? platform;
  const colorClass = PLATFORM_COLORS[platform] ?? PLATFORM_COLORS.other;

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );
}

interface StreamLinksListProps {
  sessions: LiveSessionWithStreamer[];
  variant?: "active" | "past";
  currentUserId?: string | null;
}

export function StreamLinksList({
  sessions,
  variant = "active",
  currentUserId = null,
}: StreamLinksListProps) {
  if (sessions.length === 0) return null;

  const isActive = variant === "active";

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div
          key={session.id}
          className={
            isActive
              ? "rounded-xl border border-emerald-800/50 bg-emerald-950/20 p-5"
              : "rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <PlatformBadge platform={session.platform} />
            {session.live_verified && isActive && (
              <span className="rounded-md border border-emerald-700/50 bg-emerald-900/40 px-2 py-0.5 text-xs text-emerald-200">
                Verified
              </span>
            )}
            <Link
              href={`/streamers/${session.streamer_id}`}
              className="text-sm font-medium text-violet-400 hover:underline"
            >
              {session.profiles?.display_name ?? "Anonymous"}
            </Link>
            <span className="text-xs text-zinc-500">
              {formatRelativeTime(session.started_at)}
            </span>
            {session.platform_viewer_count != null && isActive && (
              <span className="text-xs text-zinc-500">
                {session.platform_viewer_count} viewers
              </span>
            )}
          </div>
          {session.platform_title && (
            <p className="mt-2 text-sm text-zinc-300">{session.platform_title}</p>
          )}
          <a
            href={session.stream_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block truncate text-sm text-zinc-400 hover:text-violet-300"
          >
            {session.stream_url}
          </a>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={session.stream_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button size="sm" className="gap-2" variant={isActive ? "default" : "outline"}>
                {isActive ? "Watch stream" : "Open link"}
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
            {isActive && currentUserId === session.streamer_id && (
              <EndStreamButton sessionId={session.id} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
