import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: string | Date): string {
  const then = new Date(date).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

export function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/** @deprecated Use DB `trending_score` when available; client fallback only */
export function trendingScore(upvoteCount: number, createdAt: string): number {
  return computeClientTrendingScore(upvoteCount, createdAt);
}

/** Lightweight client fallback when DB trending_score column is unavailable */
export function computeClientTrendingScore(
  upvoteCount: number,
  createdAt: string
): number {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  const ln2 = 0.6931471805599453;
  const recencyBoost = 0.5 * Math.exp(-ln2 * (ageHours / 24));
  const upvoteSignal = upvoteCount * 3 * Math.exp(-ln2 * (ageHours / 12));
  return upvoteSignal + recencyBoost;
}

export function formatTrendingScore(score: number): string {
  if (score >= 100) return `${Math.round(score)}`;
  if (score >= 10) return score.toFixed(1);
  if (score >= 1) return score.toFixed(2);
  return score.toFixed(3);
}

const REQUEST_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  live_now: "Live Now",
  completed: "Completed",
};

export function formatRequestStatus(status: string): string {
  return REQUEST_STATUS_LABELS[status] ?? status;
}
