import { NextResponse } from "next/server";
import { isValidCoordinates } from "@/lib/location";

const NOMINATIM_UA =
  "Streamquest/1.0 (https://streamquest-green.vercel.app; contact@streamquest.app)";

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30;
const buckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  );
}

function rateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_MAX) return false;
  bucket.count += 1;
  return true;
}

export async function GET(request: Request) {
  if (!rateLimit(clientKey(request))) {
    return NextResponse.json(
      { error: "Too many geocode requests. Try again shortly." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (q.length >= 2) {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json", "User-Agent": NOMINATIM_UA },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Geocoding service unavailable" },
        { status: 502 }
      );
    }

    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;
    const hit = data[0];
    if (!hit) {
      return NextResponse.json({ result: null });
    }

    const latitude = Number(hit.lat);
    const longitude = Number(hit.lon);
    if (!isValidCoordinates(latitude, longitude)) {
      return NextResponse.json({ result: null });
    }

    return NextResponse.json({
      result: {
        latitude,
        longitude,
        label: hit.display_name.split(",").slice(0, 3).join(",").trim(),
      },
    });
  }

  if (lat != null && lon != null) {
    const latitude = Number(lat);
    const longitude = Number(lon);
    if (!isValidCoordinates(latitude, longitude)) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("format", "json");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json", "User-Agent": NOMINATIM_UA },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ label: null });
    }

    const data = (await res.json()) as {
      address?: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        country?: string;
      };
      display_name?: string;
    };

    const a = data.address;
    if (a) {
      const city = a.city ?? a.town ?? a.village;
      const parts = [city, a.state, a.country].filter(Boolean);
      if (parts.length > 0) {
        return NextResponse.json({ label: parts.join(", ") });
      }
    }

    return NextResponse.json({
      label: data.display_name?.split(",").slice(0, 3).join(",").trim() ?? null,
    });
  }

  return NextResponse.json(
    { error: "Provide q= for search or lat=&lon= for reverse" },
    { status: 400 }
  );
}
