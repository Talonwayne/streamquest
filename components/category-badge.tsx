import { Badge } from "@/components/ui/badge";
import { formatCategory } from "@/lib/categories";
import type { RequestCategory } from "@/types/database";

interface CategoryBadgeProps {
  category: RequestCategory;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <Badge variant="secondary" className={className}>
      {formatCategory(category)}
    </Badge>
  );
}
