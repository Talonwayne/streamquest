import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: string | Date): string {
  const then = new Date(date).getTime();
  const now = typeof window !== "undefined" ? Date.now() : then;
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

export function trendingScore(upvoteCount: number, createdAt: string): number {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  return upvoteCount / Math.pow(ageHours + 2, 1.5);
}
