import { NextResponse } from "next/server";

/**
 * Simple SVG badge streamers can embed: "Fulfilling a Streamquest request"
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const label = searchParams.get("label") ?? "Streamquest";
  const message = searchParams.get("message") ?? "fulfilling a request";

  const escapedLabel = label.replace(/[<>&]/g, "");
  const escapedMessage = message.replace(/[<>&]/g, "");
  const width = Math.max(160, escapedLabel.length * 7 + escapedMessage.length * 7 + 40);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${escapedLabel}: ${escapedMessage}">
  <title>${escapedLabel}: ${escapedMessage}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="m"><rect width="${width}" height="20" rx="3" fill="#fff"/></mask>
  <g mask="url(#m)">
    <rect width="80" height="20" fill="#4c1d95"/>
    <rect x="80" width="${width - 80}" height="20" fill="#27272a"/>
    <rect width="${width}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="40" y="14">${escapedLabel}</text>
    <text x="${80 + (width - 80) / 2}" y="14">${escapedMessage}</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
