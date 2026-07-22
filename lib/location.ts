/** Shared lat/lng validation and location payload helpers. */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationPayload extends Coordinates {
  locationLabel?: string | null;
}

export interface ParsedLocation {
  latitude: number | null;
  longitude: number | null;
  location_label: string | null;
  location_updated_at?: string | null;
}

export function isValidLatitude(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180
  );
}

export function isValidCoordinates(
  latitude: unknown,
  longitude: unknown
): latitude is number {
  return isValidLatitude(latitude) && isValidLongitude(longitude);
}

export function assertCoordinates(
  latitude: unknown,
  longitude: unknown
): Coordinates | null {
  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) return null;
  return { latitude, longitude };
}

/**
 * Parse optional location from a request body.
 * - Both lat/lng omitted or null → clear / omit location
 * - One present without the other → error
 * - Both present → validate ranges
 */
export function parseLocationInput(input: {
  latitude?: unknown;
  longitude?: unknown;
  locationLabel?: unknown;
  clearLocation?: unknown;
}):
  | { ok: true; location: ParsedLocation | null; clear: boolean }
  | { ok: false; error: string } {
  const clear = input.clearLocation === true;

  const hasLat = input.latitude !== undefined && input.latitude !== null;
  const hasLng = input.longitude !== undefined && input.longitude !== null;

  if (clear || (!hasLat && !hasLng)) {
    return {
      ok: true,
      clear,
      location: clear
        ? {
            latitude: null,
            longitude: null,
            location_label: null,
            location_updated_at: null,
          }
        : null,
    };
  }

  if (hasLat !== hasLng) {
    return { ok: false, error: "Both latitude and longitude are required" };
  }

  const latitude = typeof input.latitude === "string"
    ? Number(input.latitude)
    : input.latitude;
  const longitude = typeof input.longitude === "string"
    ? Number(input.longitude)
    : input.longitude;

  const coords = assertCoordinates(latitude, longitude);
  if (!coords) {
    return {
      ok: false,
      error: "Invalid coordinates. Latitude must be -90..90 and longitude -180..180",
    };
  }

  let location_label: string | null = null;
  if (typeof input.locationLabel === "string") {
    const trimmed = input.locationLabel.trim().slice(0, 120);
    location_label = trimmed.length > 0 ? trimmed : null;
  }

  return {
    ok: true,
    clear: false,
    location: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      location_label,
      location_updated_at: new Date().toISOString(),
    },
  };
}

/** Nominatim via app proxy — client-side; rate-limit callers (~1 req/s). */
export async function geocodePlace(
  query: string
): Promise<{ latitude: number; longitude: number; label: string } | null> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return null;

  const url = new URL("/api/geocode", window.location.origin);
  url.searchParams.set("q", trimmed);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = (await res.json()) as {
    result?: { latitude: number; longitude: number; label: string } | null;
  };

  const hit = data.result;
  if (!hit || !isValidCoordinates(hit.latitude, hit.longitude)) return null;
  return hit;
}

export async function reverseGeocodeLabel(
  latitude: number,
  longitude: number
): Promise<string | null> {
  const url = new URL("/api/geocode", window.location.origin);
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = (await res.json()) as { label?: string | null };
    return data.label ?? null;
  } catch {
    return null;
  }
}
