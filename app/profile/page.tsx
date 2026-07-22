import { requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/profile-form";
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

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      {params.setup === "streamer" && (
        <p className="mb-6 rounded-lg border border-amber-800/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
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
    </div>
  );
}
