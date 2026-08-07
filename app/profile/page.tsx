import { requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/profile-form";
import { PlatformLinkForm } from "@/components/platform-link-form";
import type { UserRole } from "@/types/database";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>;
}) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: streamerProfile } = await supabase
    .from("streamer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const platformLinks = (streamerProfile?.platform_links ?? {}) as {
    twitch?: string;
    youtube?: string;
    kick?: string;
  };

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const badgeUrl = appUrl
    ? `${appUrl}/api/badge?message=${encodeURIComponent("fulfilling a request")}`
    : "/api/badge";

  return (
    <div className="mx-auto max-w-lg px-4 py-10 space-y-8">
      {params.setup === "streamer" && (
        <p className="rounded-lg border border-amber-800/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
          Set your role to Streamer or Both to access the streamer dashboard.
        </p>
      )}
      <ProfileForm
        initialDisplayName={profile?.display_name ?? ""}
        initialRole={(profile?.role as UserRole) ?? "viewer"}
        initialBio={streamerProfile?.bio ?? ""}
        initialPlatformLinks={platformLinks}
        initialLatitude={streamerProfile?.latitude ?? null}
        initialLongitude={streamerProfile?.longitude ?? null}
        initialLocationLabel={streamerProfile?.location_label ?? null}
      />

      <PlatformLinkForm
        initialTwitchUrl={platformLinks.twitch ?? ""}
        initialYoutubeUrl={platformLinks.youtube ?? ""}
        twitchLinked={Boolean(streamerProfile?.twitch_user_id)}
        youtubeLinked={Boolean(streamerProfile?.youtube_channel_id)}
      />

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h3 className="font-semibold text-white">Streamer invite badge</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Embed this in your about panel or Discord to funnel viewers into Streamquest demand.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={badgeUrl} alt="Streamquest badge" className="mt-3" />
        <code className="mt-2 block break-all rounded bg-zinc-950 p-2 text-[10px] text-zinc-400">
          {`<a href="${appUrl || "https://streamquest-green.vercel.app"}/requests"><img src="${badgeUrl}" alt="Streamquest" /></a>`}
        </code>
      </div>
    </div>
  );
}
