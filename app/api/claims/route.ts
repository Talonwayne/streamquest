import { NextResponse } from "next/server";

/** @deprecated Claims are deprecated. Use POST /api/go-live with requestId instead. */
export async function POST() {
  return NextResponse.json(
    {
      error: "Claims are deprecated. Go live directly on a request instead.",
      migration: "Use POST /api/go-live with { requestId, streamUrl, platform }",
    },
    { status: 410 }
  );
}
