"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { geocodePlace, reverseGeocodeLabel } from "@/lib/location";
import { MapPin, Navigation } from "lucide-react";

export interface LocationValue {
  latitude: number | null;
  longitude: number | null;
  locationLabel: string;
}

interface LocationPickerProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  idPrefix?: string;
}

export function LocationPicker({
  value,
  onChange,
  idPrefix = "location",
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState(value.locationLabel);
  const [searching, setSearching] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastGeocodeRef = useRef(0);

  useEffect(() => {
    // Keep the search field in sync when parent location changes (profile load / clear).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- controlled sync from props
    setSearchQuery(value.locationLabel);
  }, [value.locationLabel]);

  const runGeocode = useCallback(
    async (query: string) => {
      const now = Date.now();
      // Nominatim: max ~1 request/second
      if (now - lastGeocodeRef.current < 1100) {
        return;
      }
      lastGeocodeRef.current = now;
      setSearching(true);
      setLocalError(null);
      try {
        const result = await geocodePlace(query);
        if (!result) {
          setLocalError("No place found. Try a city name.");
          return;
        }
        onChange({
          latitude: result.latitude,
          longitude: result.longitude,
          locationLabel: result.label,
        });
        setSearchQuery(result.label);
      } catch {
        setLocalError("Search failed. Try again in a moment.");
      } finally {
        setSearching(false);
      }
    },
    [onChange]
  );

  function handleLabelChange(next: string) {
    setSearchQuery(next);
    setLocalError(null);
    onChange({
      ...value,
      locationLabel: next,
    });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (next.trim().length < 3) return;

    debounceRef.current = setTimeout(() => {
      void runGeocode(next);
    }, 800);
  }

  async function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setLocalError("Geolocation is not supported in this browser.");
      return;
    }

    setGeoLoading(true);
    setLocalError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        let label = value.locationLabel.trim();
        try {
          const reverse = await reverseGeocodeLabel(latitude, longitude);
          if (reverse) label = reverse;
        } catch {
          // keep existing label
        }
        if (!label) {
          label = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
        }
        onChange({ latitude, longitude, locationLabel: label });
        setSearchQuery(label);
        setGeoLoading(false);
      },
      (err) => {
        setLocalError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Enter a city instead."
            : "Could not get your location. Enter a city instead."
        );
        setGeoLoading(false);
      },
      { enableHighAccuracy: false, timeout: 12000 }
    );
  }

  function handleClear() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearchQuery("");
    setLocalError(null);
    onChange({ latitude: null, longitude: null, locationLabel: "" });
  }

  return (
    <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
        <div>
          <p className="text-sm font-medium text-zinc-200">Map location</p>
          <p className="mt-1 text-xs text-zinc-500">
            Location is public when shared. Use a city or region — not your home
            address.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-label`}>City / region</Label>
        <Input
          id={`${idPrefix}-label`}
          value={searchQuery}
          onChange={(e) => handleLabelChange(e.target.value)}
          placeholder="e.g. Austin, TX"
          maxLength={120}
        />
        {searching && (
          <p className="text-xs text-zinc-500">Searching map…</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleUseMyLocation()}
          disabled={geoLoading}
          className="gap-1.5"
        >
          <Navigation className="h-3.5 w-3.5" />
          {geoLoading ? "Locating…" : "Use my location"}
        </Button>
        {(value.latitude != null || searchQuery) && (
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>

      {value.latitude != null && value.longitude != null && (
        <p className="text-xs text-emerald-400/90">
          Pinned: {value.latitude.toFixed(4)}, {value.longitude.toFixed(4)}
          {value.locationLabel ? ` · ${value.locationLabel}` : ""}
        </p>
      )}

      {localError && <p className="text-xs text-amber-400">{localError}</p>}
    </div>
  );
}
