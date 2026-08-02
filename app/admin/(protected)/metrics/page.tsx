import { AdminShell, InsightCard, MetricCard, SimpleTable } from "@/components/admin";
import { getDashboardMetrics } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function AdminMetricsPage() {
  const metrics = await getDashboardMetrics();
  const funnelRows = [
    ["Research", "Article views", metrics.researchViews.toString()],
    ["Product page", "LeadRadar product-page views", metrics.productPageViews.toString()],
    ["Trial", "Trial access requests", metrics.trialAccessClicks.toString()],
    ["Install", "Install / product access actions", metrics.installClicks.toString()],
    ["Configure", "Co-build configuration", "Manual review"],
    ["Review / export", "Completed demo reviews", metrics.reviewCompletions.toString()],
    ["Feedback", "Trial / calibration feedback", metrics.feedbackCount.toString()],
    ["Paid pilot", "Confirmed pilots", "Manual review"]
  ];

  return (
    <AdminShell title="Product Validation Funnel">
      <div className="admin-grid metrics">
        <MetricCard label="Research views" value={metrics.researchViews} />
        <MetricCard label="Product-page views" value={metrics.productPageViews} />
        <MetricCard label="Trial access requests" value={metrics.trialAccessClicks} />
        <MetricCard label="Calibration feedback" value={metrics.feedbackCount} />
      </div>

      <div className="admin-grid insights" style={{ marginTop: 24 }}>
        <InsightCard
          title="SEO / GSC review"
          value="External"
          body="Use GSC as the source of truth for indexed pages, impressions, clicks, CTR, and query movement. This admin stays focused on publishing and local product signals."
        />
        <InsightCard
          title="Funnel read"
          value={metrics.productPageViews > 0 ? "Product movement" : "Waiting"}
          body={metrics.productPageViews > 0 ? "Use the stages below to locate the next drop-off. Configuration and paid pilots remain manual until there is a reliable product-side source of truth." : "Research exists, but product-page movement has not been recorded yet. Start with the product page and trial access path."}
        />
      </div>

      <div className="admin-grid" style={{ marginTop: 24 }}>
        <section className="activity-card">
          <h2>Validation funnel</h2>
          <SimpleTable
            headers={["Stage", "Signal", "Current count"]}
            rows={funnelRows}
          />
        </section>
      </div>
      <div className="admin-grid" style={{ marginTop: 24 }}>
        <section className="activity-card">
          <h2>Demo source traffic</h2>
          <SimpleTable
            headers={["Landing path", "Referrer", "Demo opens", "Last activity"]}
            rows={metrics.leadRadarDemoTraffic.map((source) => [
              source.path,
              source.referrer,
              source.clicks.toString(),
              source.lastEventAt ? formatDate(source.lastEventAt) : "-"
            ])}
          />
        </section>
      </div>
    </AdminShell>
  );
}
