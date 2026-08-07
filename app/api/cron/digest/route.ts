import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/server";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const digestTo = process.env.DIGEST_TO_EMAIL;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  );

  if (!apiKey || !from || !digestTo) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "RESEND_API_KEY, RESEND_FROM_EMAIL, or DIGEST_TO_EMAIL not set",
    });
  }

  const supabase = await createServiceClient();

  const { data: journalism } = await supabase
    .from("requests")
    .select("id, title, upvote_count")
    .eq("category", "investigative_journalism")
    .eq("status", "open")
    .order("upvote_count", { ascending: false })
    .limit(8);

  const { data: travel } = await supabase
    .from("requests")
    .select("id, title, upvote_count")
    .eq("category", "travel")
    .eq("status", "open")
    .order("upvote_count", { ascending: false })
    .limit(8);

  const section = (
    heading: string,
    rows: Array<{ id: string; title: string; upvote_count: number }> | null
  ) => {
    if (!rows?.length) return `<p><strong>${heading}</strong>: none open right now.</p>`;
    const items = rows
      .map(
        (r) =>
          `<li><a href="${appUrl}/requests/${r.id}">${r.title}</a> (${r.upvote_count} upvotes)</li>`
      )
      .join("");
    return `<h2>${heading}</h2><ul>${items}</ul>`;
  };

  const html = `
    <h1>Streamquest weekly demand digest</h1>
    <p>Top open requests in your launch niches.</p>
    ${section("Investigative Journalism", journalism)}
    ${section("Travel", travel)}
    <p><a href="${appUrl}/live">What's live now</a> · <a href="${appUrl}/map">Map</a></p>
  `;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: digestTo,
    subject: "Streamquest weekly: open investigations & travel asks",
    html,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    journalism: journalism?.length ?? 0,
    travel: travel?.length ?? 0,
  });
}
