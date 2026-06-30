import { NextResponse } from "next/server";
import { getPostBySlug, trackPostEvent } from "@/lib/db";

type RequestBody = {
  postId?: string;
  postSlug?: string;
  eventType?: "view" | "cta_click";
  ctaType?: "newsletter" | "lead_magnet" | "waitlist" | "none";
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

  if (!body.postSlug || !body.eventType || !["view", "cta_click"].includes(body.eventType)) {
    return NextResponse.json({ success: false, message: "Missing required event fields." }, { status: 400 });
  }

  const post = await getPostBySlug(body.postSlug, { preferLocal: process.env.NODE_ENV !== "production", timeoutMs: 1500 });

  if (!post) {
    return NextResponse.json({ success: false, message: "Post not found." }, { status: 404 });
  }

  await trackPostEvent({
    postId: body.postId ?? post.id,
    postSlug: post.slug,
    eventType: body.eventType,
    ctaType: body.ctaType,
    path: body.path,
    referrer: body.referrer
  });

  return NextResponse.json({ success: true });
}
