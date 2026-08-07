import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    requestId?: string;
    commentId?: string;
    reason?: string;
  };

  const reason = body.reason?.trim() ?? "";
  if ((!body.requestId && !body.commentId) || reason.length < 3) {
    return NextResponse.json(
      { error: "reason (3+ chars) and requestId or commentId required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("reports")
    .insert({
      reporter_id: user.id,
      request_id: body.requestId ?? null,
      comment_id: body.commentId ?? null,
      reason,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ id: data.id, ok: true }, { status: 201 });
}
