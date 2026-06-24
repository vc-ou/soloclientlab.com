"use client";

type PlausibleEventName = "newsletter_signup" | "resource_signup" | "waitlist_signup";

declare global {
  interface Window {
    plausible?: (eventName: PlausibleEventName) => void;
  }
}

export function trackPlausibleEvent(eventName: PlausibleEventName) {
  window.plausible?.(eventName);
}
