import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Radio } from "lucide-react";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, role")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-white">
          <Radio className="h-5 w-5 text-violet-500" />
          Streamquest
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
          <Link href="/requests" className="hover:text-white transition-colors">
            Requests
          </Link>
          <Link href="/trending" className="hover:text-white transition-colors">
            Trending
          </Link>
          <Link
            href="/streamers/dashboard"
            className="hover:text-white transition-colors"
          >
            For Streamers
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-zinc-400 sm:inline">
                {profile?.display_name ?? user.email}
              </span>
              <Link href="/profile" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Profile
              </Link>
              <form action="/auth/signout" method="post">
                <button type="submit" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/auth/login" className={cn(buttonVariants({ size: "sm" }))}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
