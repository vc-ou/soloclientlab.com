"use client";

import { useEffect, useRef } from "react";

type TrackPostAnalyticsProps = {
  postId: string;
  postSlug: string;
};

async function sendPostEvent(payload: {
  postId: string;
  postSlug: string;
  eventType: "view";
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
