import { NextResponse } from "next/server";
import { getPostBySlug } from "@/lib/domains/content";
import { trackPostEvent } from "@/lib/domains/analytics";
import { checkRateLimit, isSameOriginRequest } from "@/app/api/_lib/request-guard";

type RequestBody = {
  postId?: string;
  postSlug?: string;
  eventType?: "view" | "article_internal_link_click";
  path?: string;
  referrer?: string;
  targetUrl?: string;
};

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }
  if (!checkRateLimit(request, 120)) {
    return NextResponse.json({ success: false, message: "Too many requests." }, { status: 429 });
  }

  let body: RequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.postSlug || !body.eventType || !["view", "article_internal_link_click"].includes(body.eventType)) {
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
    path: body.path,
    referrer: body.referrer,
    targetUrl: body.targetUrl
  });

  return NextResponse.json({ success: true });
}
