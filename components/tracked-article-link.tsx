"use client";

import type { ReactNode } from "react";

async function trackInternalLinkClick(postId: string, postSlug: string, targetUrl: string) {
  try {
    await fetch("/api/post-events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        postId,
        postSlug,
        eventType: "article_internal_link_click",
        path: window.location.pathname,
        referrer: document.referrer || undefined,
        targetUrl
      }),
      keepalive: true
    });
  } catch {
    // Link analytics should never interrupt reading.
  }
}

export function TrackedArticleLink({
  href,
  postId,
  postSlug,
  children
}: {
  href?: string;
  postId: string;
  postSlug: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      onClick={() => {
        void trackInternalLinkClick(postId, postSlug, href ?? "");
      }}
    >
      {children}
    </a>
  );
}
