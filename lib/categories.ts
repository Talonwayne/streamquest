import type { RequestCategory } from "@/types/database";

export const REQUEST_CATEGORIES: RequestCategory[] = [
  "investigative_journalism",
  "game_challenge",
  "commentary",
  "gaming",
  "irl",
  "sports",
  "learning",
  "travel",
  "food",
  "music",
  "challenges",
  "events",
  "tech",
  "fitness",
  "creative",
  "other",
];

export const CATEGORY_LABELS: Record<RequestCategory, string> = {
  investigative_journalism: "Investigative Journalism",
  game_challenge: "Game Challenge",
  commentary: "Commentary",
  gaming: "Gaming",
  irl: "IRL",
  sports: "Sports",
  learning: "Learning",
  travel: "Travel",
  food: "Food",
  music: "Music",
  challenges: "Challenges",
  events: "Events",
  tech: "Tech",
  fitness: "Fitness",
  creative: "Creative",
  other: "Other",
};

const CATEGORY_SET = new Set<string>(REQUEST_CATEGORIES);

export function isValidCategory(value: unknown): value is RequestCategory {
  return typeof value === "string" && CATEGORY_SET.has(value);
}

export function formatCategory(category: RequestCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}

const TAG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 50;

/** Normalize comma-separated or string[] tags for storage and comparison. */
export function normalizeTags(input: string | string[]): string[] {
  const raw = Array.isArray(input)
    ? input
    : input.split(",").map((part) => part.trim());

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const tag of raw) {
    const value = tag.trim().toLowerCase().replace(/\s+/g, "-");
    if (!value || value.length > MAX_TAG_LENGTH) continue;
    if (!TAG_PATTERN.test(value)) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
    if (normalized.length >= MAX_TAGS) break;
  }

  return normalized;
}

export function tagsMatch(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((tag, index) => tag === sortedB[index]);
}

export function parseCategoryParam(value: string | undefined): RequestCategory | null {
  if (!value) return null;
  return isValidCategory(value) ? value : null;
}
