"use client";

import {
  ANALYTICS_DISABLED_COOKIE,
  ANALYTICS_DISABLED_STORAGE_KEY,
  UMAMI_DISABLED_STORAGE_KEY
} from "@/lib/analytics-preferences";

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, unknown>) => void;
    };
  }
}

export function isBrowserAnalyticsDisabled() {
  try {
    return (
      window.localStorage.getItem(ANALYTICS_DISABLED_STORAGE_KEY) === "1" ||
      window.localStorage.getItem(UMAMI_DISABLED_STORAGE_KEY) === "1"
    );
  } catch {
    return false;
  }
}

export function setBrowserAnalyticsDisabled(disabled: boolean) {
  const maxAge = disabled ? 60 * 60 * 24 * 365 * 5 : 0;
  document.cookie = `${ANALYTICS_DISABLED_COOKIE}=${disabled ? "1" : ""}; path=/; max-age=${maxAge}; SameSite=Lax`;

  try {
    if (disabled) {
      window.localStorage.setItem(ANALYTICS_DISABLED_STORAGE_KEY, "1");
      window.localStorage.setItem(UMAMI_DISABLED_STORAGE_KEY, "1");
    } else {
      window.localStorage.removeItem(ANALYTICS_DISABLED_STORAGE_KEY);
      window.localStorage.removeItem(UMAMI_DISABLED_STORAGE_KEY);
    }
  } catch {
    // The cookie still carries the preference when localStorage is unavailable.
  }

  window.dispatchEvent(new CustomEvent("analytics-preference-changed", { detail: { disabled } }));
}

export function trackUmamiEvent(eventName: string, eventData?: Record<string, unknown>) {
  if (isBrowserAnalyticsDisabled()) {
    return;
  }

  window.umami?.track(eventName, eventData);
}
