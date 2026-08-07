"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Radio, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/requests", label: "Requests" },
  { href: "/live", label: "Live" },
  { href: "/trending", label: "Trending" },
  { href: "/map", label: "Map" },
  { href: "/categories", label: "Categories" },
  { href: "/explore/investigative-journalism", label: "Journalism" },
  { href: "/explore/travel", label: "Travel" },
  { href: "/streamers/dashboard", label: "For Streamers" },
] as const;

interface SiteHeaderClientProps {
  userEmail: string | null;
  displayName: string | null;
  isLoggedIn: boolean;
}

export function SiteHeaderClient({
  userEmail,
  displayName,
  isLoggedIn,
}: SiteHeaderClientProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-white">
          <Radio className="h-5 w-5 text-violet-500" />
          Streamquest
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-zinc-400 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {isLoggedIn ? (
            <>
              <span className="hidden text-sm text-zinc-400 sm:inline max-w-[10rem] truncate">
                {displayName ?? userEmail}
              </span>
              <Link
                href="/profile"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Profile
              </Link>
              <form action="/auth/signout" method="post" className="hidden sm:block">
                <button
                  type="submit"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/auth/login" className={cn(buttonVariants({ size: "sm" }))}>
              Sign in
            </Link>
          )}

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-zinc-300 hover:bg-zinc-800 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3 text-sm">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-zinc-300 hover:text-white"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn && (
              <form action="/auth/signout" method="post">
                <button type="submit" className="text-zinc-400 hover:text-white">
                  Sign out
                </button>
              </form>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
