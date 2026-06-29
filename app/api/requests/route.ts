import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("requests")
    .select("*, profiles!requests_author_id_fkey(display_name, avatar_url)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description } = await request.json();

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "Title and description required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("requests")
    .insert({
      author_id: user.id,
      title: title.trim(),
      description: description.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
