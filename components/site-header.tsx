import { createClient } from "@/lib/supabase/server";
import { SiteHeaderClient } from "@/components/site-header-client";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    displayName = data?.display_name ?? null;
  }

  return (
    <SiteHeaderClient
      isLoggedIn={!!user}
      userEmail={user?.email ?? null}
      displayName={displayName}
    />
  );
}
