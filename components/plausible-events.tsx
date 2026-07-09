"use client";

type PlausibleEventName =
  | "newsletter_signup"
  | "resource_signup"
  | "waitlist_signup"
  | "tool_started"
  | "tool_completed"
  | "tool_feedback_submitted";

declare global {
  interface Window {
    plausible?: (eventName: PlausibleEventName) => void;
  }
}

export function trackPlausibleEvent(eventName: PlausibleEventName) {
  window.plausible?.(eventName);
}
