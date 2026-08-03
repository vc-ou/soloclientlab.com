import Link from "next/link";
import { headers } from "next/headers";
import { AnalyticsOptOutControl } from "@/components/analytics-opt-out-control";
import { AdminShell, InsightCard, MetricCard, SimpleTable } from "@/components/admin";
import { getUmamiAnalytics, type UmamiPeriod } from "@/lib/umami";
import { getIgnoredIpRules, getVisitorIp, isIgnoredVisitorIp } from "@/lib/visitor-ip";

type AdminUmamiPageProps = {
  searchParams: Promise<{ period?: string }>;
};

const periods: Array<{ label: string; value: UmamiPeriod }> = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" }
];

function parsePeriod(value?: string): UmamiPeriod {
  return value === "7d" || value === "30d" || value === "90d" ? value : "30d";
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

export default async function AdminUmamiPage({ searchParams }: AdminUmamiPageProps) {
  const { period } = await searchParams;
  const requestHeaders = await headers();
  const visitorIp = getVisitorIp(requestHeaders);
  const ignoredIpRules = getIgnoredIpRules();
  const currentIpIgnored = isIgnoredVisitorIp(visitorIp, ignoredIpRules);
  const selectedPeriod = parsePeriod(period);
  const analytics = await getUmamiAnalytics(selectedPeriod);

  return (
    <AdminShell title="Umami Analytics">
      <div className="admin-toolbar">
        <div className="segmented-control" aria-label="Analytics period">
          {periods.map((option) => (
            <Link
              key={option.value}
              href={`/admin/umami?period=${option.value}`}
              className={option.value === selectedPeriod ? "is-active" : ""}
              aria-current={option.value === selectedPeriod ? "page" : undefined}
            >
              {option.label}
            </Link>
          ))}
        </div>
        {analytics.dashboardUrl ? (
          <a href={analytics.dashboardUrl} className="button ghost" target="_blank" rel="noreferrer">
            Open Umami
          </a>
        ) : null}
      </div>

      {!analytics.configured ? (
        <section className="empty-state-card" style={{ marginTop: 24 }}>
          <p className="eyebrow">Setup required</p>
          <h2>Connect Umami to activate this dashboard</h2>
          <p>
            Add `NEXT_PUBLIC_UMAMI_WEBSITE_ID` for tracking and `UMAMI_API_KEY` for this admin dashboard.
            Use `UMAMI_API_ENDPOINT` if your Umami API is not hosted at the default cloud endpoint.
          </p>
        </section>
      ) : null}

      {analytics.error && analytics.configured ? (
        <section className="empty-state-card" style={{ marginTop: 24 }}>
          <p className="eyebrow">Umami API</p>
          <h2>Analytics data is temporarily unavailable</h2>
          <p>{analytics.error}</p>
        </section>
      ) : null}

      <div style={{ marginTop: 24 }}>
        <AnalyticsOptOutControl />
      </div>

      <div className="admin-grid metrics" style={{ marginTop: 24 }}>
        <MetricCard label="Pageviews" value={analytics.stats.pageviews} />
        <MetricCard label="Visitors" value={analytics.stats.visitors} />
        <MetricCard label="Visits" value={analytics.stats.visits} />
        <MetricCard label="Bounce rate" value={analytics.stats.bounceRate} hint="Percent" />
        <MetricCard label="Avg visit time" value={analytics.stats.averageVisitSeconds} hint={formatDuration(analytics.stats.averageVisitSeconds)} />
        <MetricCard label="Bounces" value={analytics.stats.bounces} />
      </div>

      <div className="admin-grid insights" style={{ marginTop: 24 }}>
        <InsightCard
          title="Tracking"
          value={analytics.configured ? "Configured" : "Waiting"}
          body="Umami pageview tracking is loaded from the public site layout when NEXT_PUBLIC_UMAMI_WEBSITE_ID is present."
        />
        <InsightCard
          title="IP filter"
          value={currentIpIgnored ? "Excluded" : "Tracking"}
          body={`Current request IP: ${visitorIp || "unknown"}. Ignored rules: ${ignoredIpRules.length > 0 ? ignoredIpRules.join(", ") : "none"}.`}
        />
        <InsightCard
          title="Events"
          value={analytics.events.length > 0 ? "Receiving" : "Quiet"}
          body="Newsletter, access, product, demo, export, and feedback actions are mirrored into Umami custom events."
        />
      </div>

      <div className="admin-grid insights" style={{ marginTop: 24 }}>
        <InsightCard
          title="Read"
          value={analytics.stats.visitors > 0 ? "Live traffic" : "No traffic yet"}
          body="Use this view for site traffic and acquisition quality. Keep Bing and GSC as the search impression source of truth."
        />
      </div>

      <section className="activity-card" style={{ marginTop: 24 }}>
        <h2>Daily pageviews</h2>
        <SimpleTable
          headers={["Date", "Pageviews"]}
          rows={
            analytics.pageviews.length > 0
              ? analytics.pageviews.map((row) => [formatDateLabel(row.date), row.views.toString()])
              : [["No data", "0"]]
          }
        />
      </section>

      <div className="admin-grid admin-two-column" style={{ marginTop: 24 }}>
        <section className="activity-card">
          <h2>Top pages</h2>
          <SimpleTable
            headers={["Path", "Views"]}
            rows={
              analytics.topPages.length > 0
                ? analytics.topPages.map((row) => [row.path, row.views.toString()])
                : [["No data", "0"]]
            }
          />
        </section>
        <section className="activity-card">
          <h2>Top referrers</h2>
          <SimpleTable
            headers={["Referrer", "Visits"]}
            rows={
              analytics.referrers.length > 0
                ? analytics.referrers.map((row) => [row.referrer, row.visits.toString()])
                : [["No data", "0"]]
            }
          />
        </section>
      </div>

      <div className="admin-grid admin-two-column" style={{ marginTop: 24 }}>
        <section className="activity-card">
          <h2>Events</h2>
          <SimpleTable
            headers={["Event", "Count"]}
            rows={
              analytics.events.length > 0
                ? analytics.events.map((row) => [row.event, row.count.toString()])
                : [["No data", "0"]]
            }
          />
        </section>
        <section className="activity-card">
          <h2>Browsers</h2>
          <SimpleTable
            headers={["Browser", "Visits"]}
            rows={
              analytics.browsers.length > 0
                ? analytics.browsers.map((row) => [row.browser, row.visits.toString()])
                : [["No data", "0"]]
            }
          />
        </section>
      </div>
    </AdminShell>
  );
}
