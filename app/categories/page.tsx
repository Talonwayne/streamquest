import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS, REQUEST_CATEGORIES } from "@/lib/categories";
import type { RequestCategory } from "@/types/database";
import { LayoutGrid } from "lucide-react";

const FEATURED: RequestCategory[] = ["investigative_journalism", "travel"];

export default async function CategoriesPage() {
  const supabase = await createClient();

  const { data: requests } = await supabase.from("requests").select("category");

  const counts = REQUEST_CATEGORIES.reduce(
    (acc, category) => {
      acc[category] = 0;
      return acc;
    },
    {} as Record<RequestCategory, number>
  );

  for (const row of requests ?? []) {
    const category = row.category as RequestCategory;
    if (category in counts) {
      counts[category] += 1;
    }
  }

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const rest = REQUEST_CATEGORIES.filter((c) => !FEATURED.includes(c));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-800/50 bg-violet-950/30 px-3 py-1 text-xs text-violet-300">
          <LayoutGrid className="h-3.5 w-3.5" />
          Browse by topic
        </div>
        <h1 className="text-3xl font-bold text-white">Categories</h1>
        <p className="mt-1 text-zinc-400">
          Launch niches first — investigative journalism and travel — then everything else.{" "}
          {total} total requests.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-white">Featured niches</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURED.map((category) => (
            <Card key={category} className="border-violet-800/40 bg-violet-950/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{CATEGORY_LABELS[category]}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-violet-300">{counts[category]}</p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={
                      category === "investigative_journalism"
                        ? "/explore/investigative-journalism"
                        : "/explore/travel"
                    }
                    className={cn(buttonVariants({ size: "sm" }))}
                  >
                    Explore niche
                  </Link>
                  <Link
                    href={`/requests?category=${category}`}
                    className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                  >
                    Browse
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((category) => (
          <Link key={category} href={`/requests?category=${category}`}>
            <Card className="h-full transition-colors hover:border-violet-700/50 hover:bg-violet-950/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{CATEGORY_LABELS[category]}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-violet-300">{counts[category]}</p>
                <p className="text-xs text-zinc-500">
                  {counts[category] === 1 ? "request" : "requests"}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
