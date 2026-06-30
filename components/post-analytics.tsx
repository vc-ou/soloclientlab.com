"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { ComponentProps } from "react";
import type { PostCtaType } from "@/lib/types";

type TrackPostAnalyticsProps = {
  postId: string;
  postSlug: string;
};

type PostCtaLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  postId: string;
  postSlug: string;
  ctaType: PostCtaType;
};

async function sendPostEvent(payload: {
  postId: string;
  postSlug: string;
  eventType: "view" | "cta_click";
  ctaType?: PostCtaType;
  path?: string;
  referrer?: string;
}) {
  try {
    await fetch("/api/post-events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      keepalive: true
    });
  } catch {
    // Analytics should never interrupt the reading or signup flow.
  }
}

export function TrackPostAnalytics({ postId, postSlug }: TrackPostAnalyticsProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;

    void sendPostEvent({
      postId,
      postSlug,
      eventType: "view",
      path: window.location.pathname,
      referrer: document.referrer || undefined
    });
  }, [postId, postSlug]);

  return null;
}

export function PostCtaLink({
  postId,
  postSlug,
  ctaType,
  href,
  onClick,
  ...props
}: PostCtaLinkProps) {
  return (
    <Link
      {...props}
      href={href}
      onClick={(event) => {
        void sendPostEvent({
          postId,
          postSlug,
          eventType: "cta_click",
          ctaType,
          path: window.location.pathname,
          referrer: document.referrer || undefined
        });
        onClick?.(event);
      }}
    />
  );
}
