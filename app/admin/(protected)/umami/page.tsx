import { headers } from "next/headers";
import { AnalyticsOptOutControl } from "@/components/analytics-opt-out-control";
import { AdminShell, InsightCard, SimpleTable } from "@/components/admin";
import { getIgnoredIpRules, getVisitorIp, isIgnoredVisitorIp } from "@/lib/visitor-ip";

const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const umamiScriptSrc = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_SRC ?? "https://cloud.umami.is/script.js";
const umamiDashboardUrl = process.env.UMAMI_DASHBOARD_URL ?? "https://cloud.umami.is";

export default async function AdminUmamiPage() {
  const requestHeaders = await headers();
  const visitorIp = getVisitorIp(requestHeaders);
  const ignoredIpRules = getIgnoredIpRules();
  const currentIpIgnored = isIgnoredVisitorIp(visitorIp, ignoredIpRules);
  const trackingConfigured = Boolean(umamiWebsiteId);

  return (
    <AdminShell title="Umami Analytics">
      <div className="admin-toolbar">
        <div>
          <p className="eyebrow">Free plan mode</p>
          <p className="admin-toolbar-copy">
            Use Umami Cloud for reports. This admin page keeps tracking setup and owner-traffic filtering visible.
          </p>
        </div>
        <a href={umamiDashboardUrl} className="button primary" target="_blank" rel="noreferrer">
          Open Umami Cloud
        </a>
      </div>

      {!trackingConfigured ? (
        <section className="empty-state-card" style={{ marginTop: 24 }}>
          <p className="eyebrow">Setup required</p>
          <h2>Connect the Umami tracking script</h2>
          <p>
            Add `NEXT_PUBLIC_UMAMI_WEBSITE_ID` in Vercel after copying the website ID from the Umami Cloud tracking code.
            No API key is needed on the free plan.
          </p>
        </section>
      ) : null}

      <div style={{ marginTop: 24 }}>
        <AnalyticsOptOutControl />
      </div>

      <div className="admin-grid insights" style={{ marginTop: 24 }}>
        <InsightCard
          title="Tracking script"
          value={trackingConfigured ? "Configured" : "Waiting"}
          body={`Script source: ${umamiScriptSrc}. Website ID: ${trackingConfigured ? "set" : "missing"}.`}
        />
        <InsightCard
          title="IP filter"
          value={currentIpIgnored ? "Excluded" : "Tracking"}
          body={`Current request IP: ${visitorIp || "unknown"}. Ignored rules: ${ignoredIpRules.length > 0 ? ignoredIpRules.join(", ") : "none"}.`}
        />
        <InsightCard
          title="Data source"
          value="Umami Cloud"
          body="Free Umami Cloud accounts can view traffic in Umami directly. API access is only needed for embedding metrics here."
        />
      </div>

      <div className="admin-grid admin-two-column" style={{ marginTop: 24 }}>
        <section className="activity-card">
          <h2>Vercel environment variables</h2>
          <SimpleTable
            headers={["Variable", "Use"]}
            rows={[
              ["NEXT_PUBLIC_UMAMI_WEBSITE_ID", "Required. Copied from Umami tracking code."],
              ["NEXT_PUBLIC_UMAMI_SCRIPT_SRC", "Required for Cloud. Use https://cloud.umami.is/script.js."],
              ["UMAMI_DASHBOARD_URL", "Optional. Opens the Umami Cloud dashboard from this admin page."],
              ["UMAMI_IGNORE_IPS", "Optional. Comma-separated owner IPs or IPv4 CIDR ranges."]
            ]}
          />
        </section>

        <section className="activity-card">
          <h2>Where to read data</h2>
          <SimpleTable
            headers={["Need", "Where"]}
            rows={[
              ["Traffic overview", "Umami Cloud -> Overview"],
              ["Custom events", "Umami Cloud -> Events"],
              ["Realtime checks", "Umami Cloud -> Realtime"],
              ["Owner traffic filter", "This page -> Browser filter"]
            ]}
          />
        </section>
      </div>
    </AdminShell>
  );
}
