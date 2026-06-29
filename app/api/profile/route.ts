import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { displayName, role, bio, platformLinks } = body as {
    displayName: string;
    role: UserRole;
    bio?: string;
    platformLinks?: { twitch?: string; youtube?: string; kick?: string };
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ display_name: displayName, role })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  if (role === "streamer" || role === "both") {
    const { error: streamerError } = await supabase.from("streamer_profiles").upsert({
      user_id: user.id,
      bio: bio ?? null,
      platform_links: platformLinks ?? {},
    });

    if (streamerError) {
      return NextResponse.json({ error: streamerError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true });
}
