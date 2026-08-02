import { AdminShell, InsightCard, MetricCard } from "@/components/admin";
import { getDashboardMetrics } from "@/lib/db";

export default async function AdminOverviewPage() {
  const metrics = await getDashboardMetrics();

  return (
    <AdminShell title="Overview">
      <div className="admin-grid metrics">
        <MetricCard label="Published posts" value={metrics.publishedPosts} />
        <MetricCard label="Product-page views" value={metrics.productPageViews} />
        <MetricCard label="Trial access requests" value={metrics.trialAccessClicks} />
      </div>
      <div className="admin-grid insights" style={{ marginTop: 24 }}>
        <InsightCard
          title="Article publishing"
          value={metrics.publishedPosts > 0 ? "Live" : "Waiting"}
          body="Use Posts to publish SEO-ready articles, then review queries, impressions, clicks, CTR, and indexed pages in GSC."
        />
        <InsightCard
          title="Product movement"
          value={metrics.productPageViews > 0 ? "Tracked" : "Waiting"}
          body="LeadRadar now tracks product-page views, trial access actions, install actions, demo reviews, and calibration feedback."
        />
        <InsightCard
          title="Contacts and access"
          value={metrics.feedbackCount > 0 ? "Feedback received" : "Ready"}
          body="Contacts and Access Leads preserve earlier records, while Trial / Calibration Feedback keeps product learning in the core workflow."
        />
      </div>
    </AdminShell>
  );
}
