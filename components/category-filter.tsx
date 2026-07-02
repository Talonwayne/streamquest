import Link from "next/link";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS, REQUEST_CATEGORIES } from "@/lib/categories";
import type { RequestCategory } from "@/types/database";

interface CategoryFilterProps {
  activeCategory: RequestCategory | null;
}

export function CategoryFilter({ activeCategory }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/requests"
        className={cn(
          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
          activeCategory === null
            ? "border-violet-600 bg-violet-600/20 text-violet-200"
            : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
        )}
      >
        All
      </Link>
      {REQUEST_CATEGORIES.map((category) => (
        <Link
          key={category}
          href={`/requests?category=${category}`}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            activeCategory === category
              ? "border-violet-600 bg-violet-600/20 text-violet-200"
              : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
          )}
        >
          {CATEGORY_LABELS[category]}
        </Link>
      ))}
    </div>
  );
}
