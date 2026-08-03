"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { isBrowserAnalyticsDisabled } from "@/components/umami-events";

const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const umamiScriptSrc = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_SRC ?? "https://cloud.umami.is/script.js";
const umamiHostUrl = process.env.NEXT_PUBLIC_UMAMI_HOST_URL;
const umamiDomains = process.env.NEXT_PUBLIC_UMAMI_DOMAINS;

export function UmamiScript() {
  const [canTrack, setCanTrack] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAnalyticsContext() {
      if (isBrowserAnalyticsDisabled()) {
        setCanTrack(false);
        return;
      }

      try {
        const response = await fetch("/api/analytics-context", {
          cache: "no-store"
        });

        if (!response.ok) return;

        const context = (await response.json()) as { umamiExcluded?: boolean };
        if (!cancelled && !context.umamiExcluded) {
          setCanTrack(true);
        }
      } catch {
        // If the exclusion check is unavailable, skip tracking instead of adding noisy owner visits.
      }
    }

    void loadAnalyticsContext();

    function handlePreferenceChange() {
      if (isBrowserAnalyticsDisabled()) {
        setCanTrack(false);
        return;
      }

      void loadAnalyticsContext();
    }

    window.addEventListener("analytics-preference-changed", handlePreferenceChange);

    return () => {
      cancelled = true;
      window.removeEventListener("analytics-preference-changed", handlePreferenceChange);
    };
  }, []);

  if (!umamiWebsiteId) {
    return null;
  }

  if (!canTrack) {
    return null;
  }

  return (
    <Script
      defer
      data-website-id={umamiWebsiteId}
      data-host-url={umamiHostUrl}
      data-domains={umamiDomains}
      src={umamiScriptSrc}
      strategy="afterInteractive"
    />
  );
}
