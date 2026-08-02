"use client";

import ReactMarkdown from "react-markdown";

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

function isInternalHref(href?: string) {
  if (!href) return false;
  if (href.startsWith("/")) return true;

  try {
    const url = new URL(href);
    return url.hostname === "soloclientlab.com" || url.hostname === "www.soloclientlab.com";
  } catch {
    return false;
  }
}

export function TrackedMarkdown({
  content,
  postId,
  postSlug
}: {
  content: string;
  postId: string;
  postSlug: string;
}) {
  return (
    <ReactMarkdown
      components={{
        h1: "h2",
        a: ({ href, children }) => (
          <a
            href={href}
            onClick={() => {
              if (isInternalHref(href)) {
                void trackInternalLinkClick(postId, postSlug, href ?? "");
              }
            }}
          >
            {children}
          </a>
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
