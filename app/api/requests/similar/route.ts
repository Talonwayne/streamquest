import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeTags, tagsMatch } from "@/lib/categories";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.trim() ?? "";
  const tags = normalizeTags(searchParams.get("tags") ?? "");

  if (title.length < 3 && tags.length === 0) {
    return NextResponse.json({ similar: [] });
  }

  const supabase = await createClient();
  const similar = new Map<
    string,
    { id: string; title: string; tags: string[]; match_reason: string }
  >();

  if (title.length >= 3) {
    const escaped = title.replace(/[%_\\]/g, "\\$&");
    const { data: titleMatches } = await supabase
      .from("requests")
      .select("id, title, tags")
      .or(`title.ilike.${escaped},title.ilike.%${escaped}%`)
      .limit(20);

    for (const row of titleMatches ?? []) {
      const normalizedRowTitle = row.title.trim().toLowerCase();
      const normalizedInput = title.toLowerCase();
      const reason =
        normalizedRowTitle === normalizedInput ? "same_title" : "similar_title";
      similar.set(row.id, {
        id: row.id,
        title: row.title,
        tags: row.tags ?? [],
        match_reason: reason,
      });
    }
  }

  if (tags.length > 0) {
    const { data: tagMatches } = await supabase
      .from("requests")
      .select("id, title, tags")
      .contains("tags", tags)
      .limit(20);

    for (const row of tagMatches ?? []) {
      const rowTags = row.tags ?? [];
      if (!tagsMatch(rowTags, tags)) continue;
      similar.set(row.id, {
        id: row.id,
        title: row.title,
        tags: rowTags,
        match_reason: "same_tags",
      });
    }
  }

  return NextResponse.json({ similar: [...similar.values()] });
}
