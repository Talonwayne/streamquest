"use client";

import dynamic from "next/dynamic";
import type { MapMarker } from "@/types/database";
import { MapPin } from "lucide-react";

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

interface LiveMapClientProps {
  markers: MapMarker[];
}

export function LiveMapClient({ markers }: LiveMapClientProps) {
  if (markers.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 bg-zinc-900/60 px-6 text-center">
        <MapPin className="h-10 w-10 text-zinc-600" />
        <p className="text-lg font-medium text-zinc-200">No locations yet</p>
        <p className="max-w-sm text-sm text-zinc-500">
          When streamers share a location on their profile or while going live,
          they&apos;ll show up here.
        </p>
      </div>
    );
  }

  return <LiveMap markers={markers} />;
}
