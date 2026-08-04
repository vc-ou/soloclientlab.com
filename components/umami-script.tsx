"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { disableUmamiRuntime, isBrowserAnalyticsDisabled } from "@/components/umami-events";

const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const umamiScriptSrc = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_SRC ?? "https://cloud.umami.is/script.js";
const umamiHostUrl = process.env.NEXT_PUBLIC_UMAMI_HOST_URL;
const umamiDomains = process.env.NEXT_PUBLIC_UMAMI_DOMAINS;

export function UmamiScript() {
  const pathname = usePathname();
  const [canTrack, setCanTrack] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const excludedPath = pathname?.startsWith("/admin") ?? false;

    async function loadAnalyticsContext() {
      if (excludedPath || isBrowserAnalyticsDisabled()) {
        disableUmamiRuntime();
        setCanTrack(false);
        return;
      }

      try {
        const response = await fetch("/api/analytics-context", {
          cache: "no-store"
        });

        if (!response.ok) return;

        const context = (await response.json()) as { umamiExcluded?: boolean };
        if (!cancelled) {
          setCanTrack(!context.umamiExcluded);
        }
      } catch {
        // If the exclusion check is unavailable, skip tracking instead of adding noisy owner visits.
        if (!cancelled) {
          setCanTrack(false);
        }
      }
    }

    void loadAnalyticsContext();

    function handlePreferenceChange() {
      if (isBrowserAnalyticsDisabled()) {
        disableUmamiRuntime();
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
  }, [pathname]);

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
