import { NextResponse } from "next/server";
import { isInternalAnalyticsRequest } from "@/lib/analytics-filters";
import { trackPostEvent, trackTrialEvent } from "@/lib/db";
import type { ProductSlug, TrialEventType } from "@/lib/types";

type RequestBody = {
  toolSlug?: "tools/leadradar" | "products/leadradar" | "products/needradar-workflow-lab";
  productSlug?: ProductSlug;
  eventType?:
    | "cta_click"
    | "product_page_view"
    | "trial_access_click"
    | "install_click"
    | "demo_open"
    | "review_complete"
    | TrialEventType;
  path?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
};

const legacyEventTypes = ["cta_click", "product_page_view", "trial_access_click", "install_click", "demo_open", "review_complete"] as const;
const v2EventTypes = [
  "product_page_visit",
  "trial_access_requested",
  "partner_preview_requested",
  "install_clicked",
  "radar_config_started",
  "radar_config_completed",
  "keywords_added",
  "review_completed",
  "csv_exported",
  "calibration_feedback_submitted",
  "paid_pilot_requested",
  "demo_open"
] as const;

export async function POST(request: Request) {
  let body: RequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body." }, { status: 400 });
  }

  if (
    !body.toolSlug ||
    !body.eventType ||
    !["tools/leadradar", "products/leadradar", "products/needradar-workflow-lab"].includes(body.toolSlug) ||
    ![...legacyEventTypes, ...v2EventTypes].includes(body.eventType)
  ) {
    return NextResponse.json({ success: false, message: "Missing required event fields." }, { status: 400 });
  }

  if (isInternalAnalyticsRequest(request, {
    path: body.path,
    referrer: body.referrer,
    metadata: body.metadata
  })) {
    return NextResponse.json({ success: true, ignored: true });
  }

  if (v2EventTypes.includes(body.eventType as TrialEventType)) {
    await trackTrialEvent({
      product_slug: body.productSlug
        ?? (body.toolSlug === "products/needradar-workflow-lab" ? "needradar-workflow-lab" : "leadradar"),
      event_type: body.eventType as TrialEventType,
      path: body.path,
      referrer: body.referrer,
      metadata: body.metadata
    });
  }

  if (legacyEventTypes.includes(body.eventType as (typeof legacyEventTypes)[number])) {
    await trackPostEvent({
      postSlug: body.toolSlug,
      eventType: body.eventType as (typeof legacyEventTypes)[number],
      path: body.path,
      referrer: body.referrer
    });
  }

  return NextResponse.json({ success: true });
}
