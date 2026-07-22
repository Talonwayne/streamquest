"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { MapMarker } from "@/types/database";

const LiveMap = dynamic(
  () => import("@/components/live-map").then((m) => m.LiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[60vh] w-full items-center justify-center bg-zinc-900 text-sm text-zinc-500">
        Loading map…
      </div>
    ),
  }
);

interface MapResponse {
  markers?: MapMarker[];
  liveCount?: number;
  profileCount?: number;
}

export function LiveMapClient() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [liveCount, setLiveCount] = useState(0);
  const [profileCount, setProfileCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);

    async function loadMarkers() {
      try {
        const res = await fetch("/api/map", { signal: controller.signal });
        if (!res.ok) return;
        const data = (await res.json()) as MapResponse;
        setMarkers(data.markers ?? []);
        setLiveCount(data.liveCount ?? 0);
        setProfileCount(data.profileCount ?? 0);
      } catch {
        // Keep empty Earth map if the API / Supabase is unavailable.
      } finally {
        window.clearTimeout(timeout);
        setLoaded(true);
      }
    }

    void loadMarkers();
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <>
      <div className="border-b border-zinc-800 px-4 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Live map</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Where streamers are sharing from — live sessions first, home bases
              when idle.
            </p>
          </div>
          <div className="flex gap-4 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />
              Live ({liveCount})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
              Home base ({profileCount})
            </span>
          </div>
        </div>
      </div>

      <div className="relative w-full flex-1 md:mx-auto md:max-w-6xl md:px-4 md:py-4">
        <div className="relative h-[calc(100vh-14rem)] min-h-[60vh] w-full overflow-hidden border-y border-zinc-800 md:rounded-xl md:border">
          <LiveMap markers={markers} />
          {loaded && markers.length === 0 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-6 z-[1000] flex justify-center px-4">
              <p className="rounded-lg border border-zinc-700/80 bg-zinc-950/80 px-4 py-2 text-center text-sm text-zinc-300 shadow-lg backdrop-blur-sm">
                No locations yet — the world map is ready when streamers share
                theirs.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
