import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface RequestTagsProps {
  tags: string[];
  linkToBrowse?: boolean;
  className?: string;
}

export function RequestTags({ tags, linkToBrowse = false, className }: RequestTagsProps) {
  if (!tags.length) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className ?? ""}`}>
      {tags.map((tag) =>
        linkToBrowse ? (
          <Link key={tag} href={`/requests?tag=${encodeURIComponent(tag)}`}>
            <Badge variant="default" className="cursor-pointer hover:bg-violet-600/30">
              #{tag}
            </Badge>
          </Link>
        ) : (
          <Badge key={tag} variant="default">
            #{tag}
          </Badge>
        )
      )}
    </div>
  );
}
