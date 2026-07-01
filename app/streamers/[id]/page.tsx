import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { unwrapRelation } from "@/lib/utils";

export default async function StreamerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile || (profile.role !== "streamer" && profile.role !== "both")) {
    notFound();
  }

  const { data: streamerProfile } = await supabase
    .from("streamer_profiles")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();

  const platformLinks = (streamerProfile?.platform_links ?? {}) as {
    twitch?: string;
    youtube?: string;
    kick?: string;
  };

  const { data: completedSessions } = await supabase
    .from("live_sessions")
    .select(
      `
      id,
      started_at,
      ended_at,
      stream_url,
      platform,
      requests(title, upvote_count)
    `
    )
    .eq("streamer_id", id)
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(10);

  const links = [
    { label: "Twitch", url: platformLinks.twitch },
    { label: "YouTube", url: platformLinks.youtube },
    { label: "Kick", url: platformLinks.kick },
  ].filter((l) => l.url);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          {profile.display_name ?? "Streamer"}
        </h1>
        {streamerProfile?.bio && (
          <p className="mt-2 text-zinc-400">{streamerProfile.bio}</p>
        )}
        <Badge variant="secondary" className="mt-3">
          Streamer
        </Badge>
      </div>

      {links.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-white">Platforms</h2>
          <div className="flex flex-wrap gap-3">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-violet-600 hover:text-violet-300"
              >
                {link.label}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Completed streams</h2>
        {!completedSessions?.length ? (
          <p className="text-zinc-500">No completed streams yet.</p>
        ) : (
          <div className="space-y-3">
            {completedSessions.map((session) => {
              const req = unwrapRelation(session.requests);

              return (
                <Card key={session.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{req?.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">
                      {req?.upvote_count} upvotes
                    </span>
                    <a
                      href={session.stream_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-violet-400 hover:underline"
                    >
                      Watch replay →
                    </a>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <p className="mt-8 text-center text-sm text-zinc-500">
        <Link href="/streamers/dashboard" className="hover:text-zinc-300">
          ← Back to dashboard
        </Link>
      </p>
    </div>
  );
}
