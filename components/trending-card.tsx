import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime, formatRequestStatus, formatTrendingScore } from "@/lib/utils";
import { Eye, Radio, TrendingUp } from "lucide-react";
import type { TrendingRequest } from "@/types/database";

const statusVariant = {
  open: "default" as const,
  live_now: "warning" as const,
  completed: "success" as const,
};

interface TrendingCardProps {
  request: TrendingRequest;
  rank: number;
}

export function TrendingCard({ request, rank }: TrendingCardProps) {
  const viewerCount = request.upvote_count;

  return (
    <Card className="transition-colors hover:border-zinc-700">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600/20 text-lg font-bold text-violet-300">
            {rank}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/requests/${request.id}`}>
                <CardTitle className="hover:text-violet-400 transition-colors">
                  {request.title}
                </CardTitle>
              </Link>
              <Badge variant={statusVariant[request.status]}>
                {formatRequestStatus(request.status)}
              </Badge>
            </div>
            <p className="text-xs text-zinc-500">
              by {request.profiles?.display_name ?? "Anonymous"} ·{" "}
              {formatRelativeTime(request.created_at)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="line-clamp-2 text-sm text-zinc-400">{request.description}</p>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5 text-violet-300">
            <TrendingUp className="h-4 w-4" />
            {formatTrendingScore(request.trending_score ?? 0)} trending
          </span>
          <span className="inline-flex items-center gap-1.5 text-zinc-400">
            <Eye className="h-4 w-4" />
            {viewerCount.toLocaleString()} {viewerCount === 1 ? "viewer" : "viewers"} interested
          </span>
          <span className="inline-flex items-center gap-1.5 text-zinc-400">
            <Radio className="h-4 w-4" />
            {request.active_streamer_count ?? 0}{" "}
            {request.active_streamer_count === 1 ? "streamer" : "streamers"} live
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
