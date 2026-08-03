"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isBrowserAnalyticsDisabled, setBrowserAnalyticsDisabled } from "@/components/umami-events";

export function AnalyticsOptOutControl() {
  const router = useRouter();
  const [disabled, setDisabled] = useState<boolean | undefined>(undefined);
  const [message, setMessage] = useState("Choose whether this browser should be counted by Umami.");

  useEffect(() => {
    setDisabled(isBrowserAnalyticsDisabled());

    function handlePreferenceChange() {
      setDisabled(isBrowserAnalyticsDisabled());
    }

    window.addEventListener("analytics-preference-changed", handlePreferenceChange);
    return () => window.removeEventListener("analytics-preference-changed", handlePreferenceChange);
  }, []);

  function updatePreference(nextDisabled: boolean) {
    setBrowserAnalyticsDisabled(nextDisabled);
    setDisabled(nextDisabled);
    setMessage(nextDisabled ? "Saved. This browser is excluded from Umami tracking." : "Saved. This browser is allowed to send Umami tracking again.");
    router.refresh();
  }

  return (
    <section className="activity-card analytics-opt-out-card">
      <div>
        <p className="insight-label">Browser filter</p>
        <h2>This browser is {disabled ? "excluded" : "trackable"}</h2>
        <p>
          Use this when your Wi-Fi or proxy IP changes. The setting is stored in this browser, so Umami will stay disabled
          for your own visits without relying on IP matching.
        </p>
      </div>
      <div className="hero-actions">
        <button type="button" className="button primary" onClick={() => updatePreference(true)} disabled={disabled === true}>
          {disabled === true ? "Browser excluded" : "Exclude this browser"}
        </button>
        <button type="button" className="button ghost" onClick={() => updatePreference(false)} disabled={disabled === false}>
          {disabled === false ? "Tracking allowed" : "Allow tracking"}
        </button>
      </div>
      <p className={`form-feedback analytics-opt-out-feedback${disabled ? " success" : ""}`} aria-live="polite">
        {message}
      </p>
    </section>
  );
}
