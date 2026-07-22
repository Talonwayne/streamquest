"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { MapMarker } from "@/types/database";
import { STREAM_PLATFORM_LABELS } from "@/lib/stream-links";
import "leaflet/dist/leaflet.css";

interface LiveMapProps {
  markers: MapMarker[];
}

function createMarkerIcon(kind: MapMarker["kind"]) {
  const color = kind === "live" ? "#a78bfa" : "#71717a";
  const pulse =
    kind === "live"
      ? `<span style="position:absolute;inset:-4px;border-radius:9999px;background:${color};opacity:0.35;animation:sq-pulse 1.6s ease-out infinite"></span>`
      : "";

  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:18px;height:18px">
      ${pulse}
      <span style="position:absolute;inset:2px;border-radius:9999px;background:${color};border:2px solid #fafafa;box-shadow:0 1px 4px rgba(0,0,0,0.5)"></span>
    </div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) {
      map.setView([20, 0], 2);
      return;
    }
    if (markers.length === 1) {
      const m = markers[0]!;
      map.setView([m.latitude, m.longitude], 5);
      return;
    }
    const bounds = L.latLngBounds(
      markers.map((m) => [m.latitude, m.longitude] as [number, number])
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
  }, [map, markers]);

  return null;
}

export function LiveMap({ markers }: LiveMapProps) {
  const liveIcon = useMemo(() => createMarkerIcon("live"), []);
  const profileIcon = useMemo(() => createMarkerIcon("profile"), []);

  return (
    <div className="relative h-full w-full min-h-[60vh]">
      <style>{`
        @keyframes sq-pulse {
          0% { transform: scale(0.85); opacity: 0.45; }
          70% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .leaflet-container {
          height: 100%;
          width: 100%;
          background: #09090b;
          font-family: inherit;
        }
        .leaflet-popup-content-wrapper {
          background: #18181b;
          color: #f4f4f5;
          border-radius: 10px;
          border: 1px solid #27272a;
          box-shadow: 0 8px 24px rgba(0,0,0,0.45);
        }
        .leaflet-popup-tip {
          background: #18181b;
        }
        .leaflet-popup-content {
          margin: 12px 14px;
          min-width: 160px;
        }
        .leaflet-control-attribution {
          background: rgba(9,9,11,0.75) !important;
          color: #71717a !important;
        }
        .leaflet-control-attribution a {
          color: #a1a1aa !important;
        }
      `}</style>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom
        className="h-full w-full rounded-none md:rounded-xl"
        worldCopyJump
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds markers={markers} />
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.latitude, marker.longitude]}
            icon={marker.kind === "live" ? liveIcon : profileIcon}
          >
            <Popup>
              <div className="space-y-1.5 text-sm">
                <p className="font-semibold text-zinc-100">
                  {marker.display_name ?? "Streamer"}
                </p>
                {marker.kind === "live" && marker.request_title && (
                  <p className="text-zinc-300">{marker.request_title}</p>
                )}
                {marker.platform && (
                  <p className="text-xs text-zinc-400">
                    {STREAM_PLATFORM_LABELS[marker.platform]}
                    {marker.kind === "live" ? " · Live now" : ""}
                  </p>
                )}
                {marker.kind === "profile" && (
                  <p className="text-xs text-zinc-400">Home base</p>
                )}
                {marker.location_label && (
                  <p className="text-xs text-zinc-500">{marker.location_label}</p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {marker.stream_url && (
                    <a
                      href={marker.stream_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 hover:text-violet-300 underline text-xs"
                    >
                      Watch
                    </a>
                  )}
                  {marker.request_id && (
                    <a
                      href={`/requests/${marker.request_id}`}
                      className="text-violet-400 hover:text-violet-300 underline text-xs"
                    >
                      Request
                    </a>
                  )}
                  <a
                    href={`/streamers/${marker.streamer_id}`}
                    className="text-violet-400 hover:text-violet-300 underline text-xs"
                  >
                    Profile
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
