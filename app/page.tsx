import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRight, Bell, Radio, TrendingUp, Users } from "lucide-react";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden px-4 py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/30 via-zinc-950 to-zinc-950" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-800/50 bg-violet-950/30 px-4 py-1.5 text-sm text-violet-300">
            <Radio className="h-4 w-4" />
            Request-driven stream discovery
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl">
            Watch what you{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              actually want
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            Post stream ideas. Upvote what sounds fun. Get notified when a streamer goes live
            doing exactly that — on Twitch, YouTube, Kick, or anywhere.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/requests/new" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
              Request a stream
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/streamers/dashboard" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
              I&apos;m a streamer
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-800 bg-zinc-950 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-bold text-white md:text-3xl">
            How it works
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-zinc-800 bg-zinc-900/30">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20">
                  <TrendingUp className="h-5 w-5 text-violet-400" />
                </div>
                <h3 className="font-semibold text-white">1. Request & upvote</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Viewers post ideas like &ldquo;blindfolded Mario 64&rdquo; or &ldquo;cooking with chat
                  recipes.&rdquo; Upvote what you want to see.
                </p>
              </CardContent>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900/30">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20">
                  <Users className="h-5 w-5 text-violet-400" />
                </div>
                <h3 className="font-semibold text-white">2. Streamers claim</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Smaller streamers browse demand, claim requests they can fulfill, and get a
                  built-in audience before going live.
                </p>
              </CardContent>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900/30">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20">
                  <Bell className="h-5 w-5 text-violet-400" />
                </div>
                <h3 className="font-semibold text-white">3. Get notified</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  When a streamer goes live with your request, everyone who upvoted gets a push
                  or email with a link to watch.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-800 px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Discovery by content, not clout
          </h2>
          <p className="mt-4 text-zinc-400">
            Streamquest flips the script. Instead of chasing followers, streamers compete on
            fulfilling what viewers actually want to watch. Every fulfilled request is proof of
            demand — and a notification list of people ready to tune in.
          </p>
          <Link href="/requests" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "mt-8 inline-flex")}>
            Browse open requests
          </Link>
        </div>
      </section>
    </>
  );
}
