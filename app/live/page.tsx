import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/category-badge";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";
import { STREAM_PLATFORM_LABELS } from "@/lib/stream-links";
import { Radio } from "lucide-react";
import type { Metadata } from "next";
import type { StreamPlatform } from "@/types/database";

export const metadata: Metadata = {
  title: "Live Now",
  description: "Active streams fulfilling Streamquest requests right now.",
};

export const dynamic = "force-dynamic";

interface LiveRow {
  id: string;
  stream_url: string;
  platform: StreamPlatform;
  started_at: string;
  platform_title: string | null;
  platform_viewer_count: number | null;
  live_verified: boolean | null;
  request_id: string;
  streamer_id: string;
  requests: { title: string; category: string } | { title: string; category: string }[] | null;
  profiles: { display_name: string | null } | { display_name: string | null }[] | null;
}

function unwrap<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function LivePage() {
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("live_sessions")
    .select(
      `
      id,
      stream_url,
      platform,
      started_at,
      platform_title,
      platform_viewer_count,
      live_verified,
      request_id,
      streamer_id,
      requests ( title, category ),
      profiles!live_sessions_streamer_id_fkey ( display_name )
    `
    )
    .is("ended_at", null)
    .order("started_at", { ascending: false });

  const rows = (sessions ?? []) as LiveRow[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-emerald-400">
          <Radio className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-wide">Live Now</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Streams happening now</h1>
        <p className="mt-1 text-zinc-400">
          Active fulfillments across open requests. Watch, or{" "}
          <Link href="/requests" className="text-violet-400 hover:underline">
            browse demand
          </Link>{" "}
          to go live yourself.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 py-16 text-center">
          <p className="text-zinc-400">No one is live right now.</p>
          <Link
            href="/requests"
            className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex")}
          >
            Find a request to fulfill
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((session) => {
            const request = unwrap(session.requests);
            const profile = unwrap(session.profiles);
            return (
              <div
                key={session.id}
                className="rounded-xl border border-emerald-800/40 bg-emerald-950/15 p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="warning">Live</Badge>
                  {session.live_verified && (
                    <Badge variant="success">Verified live</Badge>
                  )}
                  <span className="text-xs text-zinc-500">
                    {STREAM_PLATFORM_LABELS[session.platform] ?? session.platform}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {formatRelativeTime(session.started_at)}
                  </span>
                  {session.platform_viewer_count != null && (
                    <span className="text-xs text-zinc-500">
                      {session.platform_viewer_count} viewers
                    </span>
                  )}
                </div>
                <h2 className="mt-2 text-lg font-semibold text-white">
                  <Link
                    href={`/requests/${session.request_id}`}
                    className="hover:text-violet-300"
                  >
                    {request?.title ?? "Untitled request"}
                  </Link>
                </h2>
                {session.platform_title && (
                  <p className="mt-1 text-sm text-zinc-400">{session.platform_title}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                  {request?.category && (
                    <CategoryBadge category={request.category as never} />
                  )}
                  <Link
                    href={`/streamers/${session.streamer_id}`}
                    className="text-violet-400 hover:underline"
                  >
                    {profile?.display_name ?? "Anonymous"}
                  </Link>
                </div>
                <a
                  href={session.stream_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ size: "sm" }), "mt-4 inline-flex")}
                >
                  Watch stream
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
