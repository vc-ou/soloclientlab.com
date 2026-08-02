"use client";

type PlausibleEventName =
  | "newsletter_signup"
  | "resource_signup"
  | "waitlist_signup"
  | "tool_demo_clicked"
  | "tool_started"
  | "tool_completed"
  | "tool_feedback_submitted"
  | "trial_access_requested"
  | "partner_preview_requested"
  | "radar_config_completed"
  | "paid_pilot_requested"
  | "csv_exported";

declare global {
  interface Window {
    plausible?: (eventName: PlausibleEventName) => void;
  }
}

export function trackPlausibleEvent(eventName: PlausibleEventName) {
  window.plausible?.(eventName);
}
