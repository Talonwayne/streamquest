import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { RequestCard } from "@/components/request-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NICHE_TEMPLATES } from "@/lib/niche-templates";
import type { RequestCategory, RequestWithAuthor } from "@/types/database";

const NICHE_META: Record<
  string,
  { category: RequestCategory; title: string; description: string; headline: string }
> = {
  "investigative-journalism": {
    category: "investigative_journalism",
    title: "Investigative Journalism streams",
    description:
      "Request live investigations, FOIA walkthroughs, and accountability streams. Discover journalists and creators filling real demand.",
    headline: "Investigative Journalism",
  },
  travel: {
    category: "travel",
    title: "Travel streams",
    description:
      "Request live travel coverage — markets, neighborhoods, routes. Discover creators who go where the asks are.",
    headline: "Travel",
  },
};

export function generateStaticParams() {
  return Object.keys(NICHE_META).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = NICHE_META[slug];
  if (!meta) return { title: "Explore" };
  return {
    title: meta.title,
    description: meta.description,
    openGraph: { title: meta.title, description: meta.description },
  };
}

export default async function ExploreNichePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = NICHE_META[slug];
  if (!meta) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-white">Niche not found</h1>
        <Link href="/categories" className="mt-4 inline-block text-violet-400">
          Browse categories
        </Link>
      </div>
    );
  }

  const templates = NICHE_TEMPLATES[meta.category] ?? [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: requests } = await supabase
    .from("requests")
    .select("*, profiles!requests_author_id_fkey(display_name, avatar_url)")
    .eq("category", meta.category)
    .order("trending_score", { ascending: false })
    .limit(30);

  let userUpvotes = new Set<string>();
  if (user && requests?.length) {
    const { data: upvotes } = await supabase
      .from("upvotes")
      .select("request_id")
      .eq("user_id", user.id);
    userUpvotes = new Set(upvotes?.map((u) => u.request_id) ?? []);
  }

  const list = (requests ?? []) as RequestWithAuthor[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-violet-400">
          Niche explore
        </p>
        <h1 className="mt-1 text-3xl font-bold text-white">{meta.headline}</h1>
        <p className="mt-2 text-zinc-400">{meta.description}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/requests/new?category=${meta.category}`}
            className={cn(buttonVariants())}
          >
            Post a {meta.headline.toLowerCase()} request
          </Link>
          <Link
            href={`/requests?category=${meta.category}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Browse all
          </Link>
          <Link href="/map" className={cn(buttonVariants({ variant: "ghost" }))}>
            View on map
          </Link>
        </div>
      </div>

      {templates.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-white">Starter ideas</h2>
          <ul className="space-y-2">
            {templates.map((t) => (
              <li key={t.title}>
                <Link
                  href={`/requests/new?category=${meta.category}&title=${encodeURIComponent(t.title)}&tags=${encodeURIComponent(t.tags.join(","))}`}
                  className="block rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-300 hover:border-violet-700/50 hover:text-white"
                >
                  <span className="font-medium text-white">{t.title}</span>
                  <span className="mt-1 block text-xs text-zinc-500">{t.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Open demand</h2>
        {list.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-700 py-12 text-center">
            <p className="text-zinc-400">No requests in this niche yet.</p>
            <Link
              href={`/requests/new?category=${meta.category}`}
              className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex")}
            >
              Be the first
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                userUpvoted={userUpvotes.has(request.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
