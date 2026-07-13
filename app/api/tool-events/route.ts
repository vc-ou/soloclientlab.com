import { NextResponse } from "next/server";
import { trackPostEvent } from "@/lib/db";

type RequestBody = {
  toolSlug?: "tools/leadradar";
  eventType?: "cta_click";
  path?: string;
  referrer?: string;
};

export async function POST(request: Request) {
  let body: RequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body." }, { status: 400 });
  }

  if (body.toolSlug !== "tools/leadradar" || body.eventType !== "cta_click") {
    return NextResponse.json({ success: false, message: "Missing required event fields." }, { status: 400 });
  }

  await trackPostEvent({
    postSlug: body.toolSlug,
    eventType: body.eventType,
    ctaType: "tool_demo",
    path: body.path,
    referrer: body.referrer
  });

  return NextResponse.json({ success: true });
}
