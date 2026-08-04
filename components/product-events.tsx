"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { isBrowserAnalyticsDisabled, trackUmamiEvent } from "@/components/umami-events";
import type { ProductSlug } from "@/lib/types";

type ProductEventType =
  | "product_page_visit"
  | "trial_access_requested"
  | "partner_preview_requested"
  | "install_clicked"
  | "radar_config_started"
  | "radar_config_completed"
  | "keywords_added"
  | "review_completed"
  | "csv_exported"
  | "calibration_feedback_submitted"
  | "paid_pilot_requested"
  | "demo_open"
  | "product_page_view"
  | "trial_access_click"
  | "install_click"
  | "review_complete";

const localHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);

function isLocalUrl(value?: string) {
  if (!value) return false;

  try {
    return localHosts.has(new URL(value).hostname);
  } catch {
    return value.includes("localhost") || value.includes("127.0.0.1");
  }
}

function shouldSkipProductEvent() {
  return (
    isBrowserAnalyticsDisabled() ||
    localHosts.has(window.location.hostname) ||
    isLocalUrl(document.referrer)
  );
}

export async function sendProductEvent(
  eventType: ProductEventType,
  metadata?: Record<string, unknown>,
  productSlug: ProductSlug = "leadradar"
) {
  if (shouldSkipProductEvent()) {
    return;
  }

  trackUmamiEvent(eventType, {
    product_slug: productSlug,
    ...metadata
  });

  try {
    await fetch("/api/tool-events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        toolSlug: productSlug === "leadradar" ? "products/leadradar" : "products/needradar-workflow-lab",
        productSlug,
        eventType,
        path: `${window.location.pathname}${window.location.search}`,
        referrer: document.referrer || undefined,
        metadata
      }),
      keepalive: true
    });
  } catch {
    // Product analytics should never interrupt the user journey.
  }
}

export function TrackProductPageView({ productSlug = "leadradar" }: { productSlug?: ProductSlug }) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    void sendProductEvent("product_page_visit", undefined, productSlug);
  }, [productSlug]);

  return null;
}

export function ProductEventLink({
  href,
  eventType,
  className,
  children,
  productSlug = "leadradar"
}: {
  href: string;
  eventType: Exclude<ProductEventType, "product_page_view">;
  className: string;
  children: React.ReactNode;
  productSlug?: ProductSlug;
}) {
  return (
    <Link href={href} className={className} onClick={() => void sendProductEvent(eventType, undefined, productSlug)}>
      {children}
    </Link>
  );
}

export function TrackProductEvent({
  eventType,
  metadata,
  productSlug = "leadradar"
}: {
  eventType: ProductEventType;
  metadata?: Record<string, unknown>;
  productSlug?: ProductSlug;
}) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    void sendProductEvent(eventType, metadata, productSlug);
  }, [eventType, metadata, productSlug]);

  return null;
}
