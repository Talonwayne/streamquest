import type { StreamPlatform } from "@/types/database";

/** Domains allowed per platform (without www. prefix; subdomains matched via suffix). */
export const ALLOWED_STREAM_DOMAINS: Record<
  Exclude<StreamPlatform, "other">,
  readonly string[]
> = {
  twitch: ["twitch.tv"],
  youtube: ["youtube.com", "youtu.be", "m.youtube.com"],
  kick: ["kick.com"],
  tiktok: ["tiktok.com", "vm.tiktok.com"],
  instagram: ["instagram.com"],
  facebook: ["facebook.com", "fb.watch", "fb.com", "m.facebook.com"],
};

export const STREAM_PLATFORM_LABELS: Record<StreamPlatform, string> = {
  twitch: "Twitch",
  youtube: "YouTube",
  kick: "Kick",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  other: "Stream",
};

/** Flat allowlist for reuse in UI or docs. */
export const ALL_ALLOWED_DOMAINS: readonly string[] = Object.values(
  ALLOWED_STREAM_DOMAINS
).flat();

const URL_SHORTENER_DOMAINS = new Set([
  "bit.ly",
  "t.co",
  "tinyurl.com",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "rebrand.ly",
  "shorturl.at",
  "cutt.ly",
  "rb.gy",
  "dlvr.it",
  "lnkd.in",
  "short.link",
]);

const IPv4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;

export interface StreamUrlValidation {
  valid: boolean;
  platform: StreamPlatform;
  error?: string;
  normalizedUrl?: string;
}

function stripWww(host: string): string {
  return host.startsWith("www.") ? host.slice(4) : host;
}

function hostnameMatchesDomain(host: string, domain: string): boolean {
  const normalizedHost = stripWww(host);
  const normalizedDomain = stripWww(domain);
  return (
    normalizedHost === normalizedDomain ||
    normalizedHost.endsWith(`.${normalizedDomain}`)
  );
}

function isIpAddress(host: string): boolean {
  if (IPv4_REGEX.test(host)) return true;
  if (host.includes(":")) return true;
  return false;
}

function parseHttpUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

function validateStreamPath(platform: StreamPlatform, url: URL): string | null {
  const segments = url.pathname.split("/").filter(Boolean);

  switch (platform) {
    case "twitch": {
      if (segments.length === 0) {
        return "Use your Twitch channel or live stream URL, not the homepage";
      }
      const blocked = new Set(["directory", "downloads", "settings", "login"]);
      if (blocked.has(segments[0]!.toLowerCase())) {
        return "Use your channel or live stream URL, not a Twitch directory page";
      }
      break;
    }
    case "youtube": {
      if (segments.length === 0) {
        return "Use a YouTube video, live, or channel link, not the homepage";
      }
      break;
    }
    case "kick": {
      if (segments.length === 0) {
        return "Use your Kick channel URL, not the homepage";
      }
      break;
    }
    case "tiktok": {
      if (segments.length === 0) {
        return "Use a TikTok profile or live link, not the homepage";
      }
      break;
    }
    case "instagram": {
      if (segments.length === 0) {
        return "Use an Instagram profile or live link, not the homepage";
      }
      break;
    }
    case "facebook": {
      const path = url.pathname.toLowerCase();
      if (
        segments.length === 0 &&
        !hostnameMatchesDomain(url.hostname, "fb.watch")
      ) {
        return "Use a Facebook watch or live link, not the homepage";
      }
      if (
        segments.length > 0 &&
        ["login", "help", "policies"].includes(segments[0]!.toLowerCase()) &&
        !path.includes("/watch")
      ) {
        return "Use a Facebook watch or live stream link";
      }
      break;
    }
    default:
      break;
  }

  return null;
}

export function detectPlatform(url: string): StreamPlatform | null {
  const parsed = parseHttpUrl(url);
  if (!parsed) return null;

  const host = parsed.hostname.toLowerCase();

  for (const [platform, domains] of Object.entries(ALLOWED_STREAM_DOMAINS) as [
    Exclude<StreamPlatform, "other">,
    readonly string[],
  ][]) {
    for (const domain of domains) {
      if (hostnameMatchesDomain(host, domain)) {
        return platform;
      }
    }
  }

  return null;
}

export function validateStreamUrl(url: string): StreamUrlValidation {
  const trimmed = url.trim();

  if (!trimmed) {
    return { valid: false, platform: "other", error: "URL is required" };
  }

  const parsed = parseHttpUrl(trimmed);
  if (!parsed) {
    return {
      valid: false,
      platform: "other",
      error: "Only http and https links are allowed",
    };
  }

  const host = parsed.hostname.toLowerCase();

  if (isIpAddress(host)) {
    return {
      valid: false,
      platform: "other",
      error: "IP address links are not allowed",
    };
  }

  const shortHost = stripWww(host);
  if (URL_SHORTENER_DOMAINS.has(shortHost)) {
    return {
      valid: false,
      platform: "other",
      error:
        "URL shorteners are not allowed. Paste the full stream link instead.",
    };
  }

  const platform = detectPlatform(trimmed);
  if (!platform) {
    return {
      valid: false,
      platform: "other",
      error:
        "Only links from Twitch, YouTube, Kick, TikTok, Instagram, and Facebook are allowed",
    };
  }

  const pathError = validateStreamPath(platform, parsed);
  if (pathError) {
    return { valid: false, platform, error: pathError };
  }

  return {
    valid: true,
    platform,
    normalizedUrl: parsed.toString(),
  };
}
