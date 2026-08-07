"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { MapMarker } from "@/types/database";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { RequestCategory } from "@/types/database";

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
  requestCount?: number;
}

const NICHE_FILTERS: Array<{ label: string; category?: RequestCategory }> = [
  { label: "All" },
  { label: "Journalism", category: "investigative_journalism" },
  { label: "Travel", category: "travel" },
  { label: "IRL", category: "irl" },
];

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function LiveMapClient() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [liveCount, setLiveCount] = useState(0);
  const [profileCount, setProfileCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [liveOnly, setLiveOnly] = useState(false);
  const [category, setCategory] = useState<RequestCategory | undefined>();
  const [nearMe, setNearMe] = useState(false);
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);

    async function loadMarkers() {
      try {
        const params = new URLSearchParams();
        if (liveOnly) params.set("liveOnly", "1");
        if (category) params.set("category", category);
        const res = await fetch(`/api/map?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as MapResponse;
        setMarkers(data.markers ?? []);
        setLiveCount(data.liveCount ?? 0);
        setProfileCount(data.profileCount ?? 0);
        setRequestCount(data.requestCount ?? 0);
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
  }, [liveOnly, category]);

  function enableNearMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setNearMe(true);
      },
      () => setNearMe(false),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  const visibleMarkers = useMemo(() => {
    if (!nearMe || !userCoords) return markers;
    return [...markers]
      .map((m) => ({
        ...m,
        _dist: haversineKm(userCoords.lat, userCoords.lon, m.latitude, m.longitude),
      }))
      .filter((m) => m._dist <= 500)
      .sort((a, b) => a._dist - b._dist);
  }, [markers, nearMe, userCoords]);

  return (
    <>
      <div className="border-b border-zinc-800 px-4 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Live map</h1>
              <p className="mt-1 text-sm text-zinc-400">
                Live sessions, open request pins, and streamer home bases.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />
                Live ({liveCount})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                Requests ({requestCount})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
                Home base ({profileCount})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {NICHE_FILTERS.map((f) => (
              <Button
                key={f.label}
                size="sm"
                variant={category === f.category ? "default" : "outline"}
                onClick={() => setCategory(f.category)}
              >
                {f.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant={liveOnly ? "default" : "outline"}
              onClick={() => setLiveOnly((v) => !v)}
            >
              Live only
            </Button>
            <Button
              size="sm"
              variant={nearMe ? "default" : "outline"}
              onClick={() => {
                if (nearMe) {
                  setNearMe(false);
                  return;
                }
                enableNearMe();
              }}
            >
              Near me
            </Button>
            {category && (
              <span className="text-xs text-zinc-500">
                {CATEGORY_LABELS[category]}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative w-full flex-1 md:mx-auto md:max-w-6xl md:px-4 md:py-4">
        <div className="relative h-[calc(100vh-14rem)] min-h-[60vh] w-full overflow-hidden border-y border-zinc-800 md:rounded-xl md:border">
          <LiveMap markers={visibleMarkers} />
          {loaded && visibleMarkers.length === 0 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-6 z-[1000] flex justify-center px-4">
              <p className="rounded-lg border border-zinc-700/80 bg-zinc-950/80 px-4 py-2 text-center text-sm text-zinc-300 shadow-lg backdrop-blur-sm">
                No locations match these filters yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
