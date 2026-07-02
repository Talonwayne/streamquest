import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryBadge } from "@/components/category-badge";
import { RequestTags } from "@/components/request-tags";
import { UpvoteButton } from "@/components/upvote-button";
import { formatRelativeTime, formatRequestStatus } from "@/lib/utils";
import type { RequestWithAuthor } from "@/types/database";

const statusVariant = {
  open: "default" as const,
  live_now: "warning" as const,
  completed: "success" as const,
};

interface RequestCardProps {
  request: RequestWithAuthor;
  userUpvoted?: boolean;
}

export function RequestCard({ request, userUpvoted = false }: RequestCardProps) {
  return (
    <Card className="transition-colors hover:border-zinc-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Link href={`/requests/${request.id}`}>
              <CardTitle className="hover:text-violet-400 transition-colors">
                {request.title}
              </CardTitle>
            </Link>
            <p className="text-xs text-zinc-500">
              by {request.profiles?.display_name ?? "Anonymous"} ·{" "}
              {formatRelativeTime(request.created_at)}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <CategoryBadge category={request.category} />
              <RequestTags tags={request.tags ?? []} linkToBrowse />
            </div>
          </div>
          <Badge variant={statusVariant[request.status]}>
            {formatRequestStatus(request.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <p className="line-clamp-2 text-sm text-zinc-400">{request.description}</p>
        <UpvoteButton
          key={`${request.id}-${request.upvote_count}-${userUpvoted}`}
          requestId={request.id}
          initialCount={request.upvote_count}
          initialUpvoted={userUpvoted}
          disabled={request.status === "completed"}
          disabledReason={request.status === "completed" ? "Request completed" : undefined}
        />
      </CardContent>
    </Card>
  );
}
