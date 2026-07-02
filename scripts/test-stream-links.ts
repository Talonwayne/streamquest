#!/usr/bin/env npx tsx
/**
 * Unit tests for lib/stream-links.ts URL validation.
 * Usage: npm run test:stream-links
 */
import { validateStreamUrl, detectPlatform } from "../lib/stream-links";

const GOOD_URLS: [string, string][] = [
  ["https://twitch.tv/ninja", "twitch"],
  ["https://www.twitch.tv/shroud/live", "twitch"],
  ["https://youtube.com/watch?v=dQw4w9WgXcQ", "youtube"],
  ["https://youtu.be/dQw4w9WgXcQ", "youtube"],
  ["https://kick.com/xqc", "kick"],
  ["https://www.tiktok.com/@user/live", "tiktok"],
  ["https://instagram.com/username/live", "instagram"],
  ["https://facebook.com/watch/live/?v=123456", "facebook"],
  ["https://fb.watch/abc123/", "facebook"],
];

const BAD_URLS: [string, string][] = [
  ["ftp://twitch.tv/ninja", "http and https"],
  ["https://192.168.1.1/stream", "IP address"],
  ["https://bit.ly/abc123", "shortener"],
  ["https://t.co/xyz", "shortener"],
  ["https://evil-scam.com/fake-twitch", "allowed"],
  ["https://twitch.tv", "homepage"],
  ["https://youtube.com", "homepage"],
  ["https://kick.com", "homepage"],
  ["javascript:alert(1)", "http and https"],
  ["not-a-url", "http and https"],
];

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean, detail = "") {
  if (condition) {
    console.log(`✓ ${name}`);
    passed++;
  } else {
    console.error(`✗ ${name}${detail ? `: ${detail}` : ""}`);
    failed++;
  }
}

for (const [url, expectedPlatform] of GOOD_URLS) {
  const result = validateStreamUrl(url);
  assert(
    `valid: ${url}`,
    result.valid && result.platform === expectedPlatform,
    `got valid=${result.valid} platform=${result.platform} error=${result.error}`
  );
  assert(
    `detect: ${url}`,
    detectPlatform(url) === expectedPlatform,
    `got ${detectPlatform(url)}`
  );
}

for (const [url, reasonFragment] of BAD_URLS) {
  const result = validateStreamUrl(url);
  assert(
    `blocked: ${url}`,
    !result.valid &&
      (result.error?.toLowerCase().includes(reasonFragment.toLowerCase()) ??
        false),
    `expected block (${reasonFragment}), got valid=${result.valid} error=${result.error}`
  );
}

console.log(`\n${passed}/${passed + failed} passed`);
if (failed) process.exit(1);
