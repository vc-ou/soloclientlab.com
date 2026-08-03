import { AnalyticsOptOutControl } from "@/components/analytics-opt-out-control";
import { AdminShell } from "@/components/admin";

const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const umamiDashboardUrl = process.env.UMAMI_DASHBOARD_URL ?? "https://cloud.umami.is";

export default function AdminUmamiPage() {
  const trackingConfigured = Boolean(umamiWebsiteId);

  return (
    <AdminShell title="Umami Analytics">
      <div className="admin-toolbar">
        <div>
          <p className="eyebrow">Free plan mode</p>
          <p className="admin-toolbar-copy">
            Open Umami Cloud to review traffic, events, and realtime activity.
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
    </AdminShell>
  );
}
