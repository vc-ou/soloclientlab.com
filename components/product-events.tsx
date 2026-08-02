"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
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

export async function sendProductEvent(
  eventType: ProductEventType,
  metadata?: Record<string, unknown>,
  productSlug: ProductSlug = "leadradar"
) {
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
  children
}: {
  href: string;
  eventType: Exclude<ProductEventType, "product_page_view">;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={className} onClick={() => void sendProductEvent(eventType)}>
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
