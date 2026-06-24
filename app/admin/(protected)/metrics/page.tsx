import { AdminShell, InsightCard, MetricCard, SimpleTable } from "@/components/admin";
import { getDashboardMetrics, getResourcePerformance } from "@/lib/db";

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default async function AdminMetricsPage() {
  const metrics = await getDashboardMetrics();
  const resources = await getResourcePerformance();

  return (
    <AdminShell title="Metrics Center">
      <div className="admin-grid metrics">
        <MetricCard label="Active subscribers" value={metrics.activeSubscribers} />
        <MetricCard label="Qualified subscribers" value={metrics.qualifiedSubscribers} />
        <MetricCard label="Resource signups" value={metrics.resourceSignups} />
        <MetricCard label="Waitlist count" value={metrics.waitlistCount} />
        <MetricCard label="Published posts" value={metrics.publishedPosts} />
        <MetricCard label="Total demands" value={metrics.totalDemands} />
      </div>

      <div className="admin-grid insights" style={{ marginTop: 24 }}>
        <InsightCard
          title="Email → Waitlist"
          value={formatPercent(metrics.emailToWaitlistRate)}
          body="How many active subscribers have moved into a higher-intent validation step."
        />
        <InsightCard
          title="Resource share"
          value={formatPercent(metrics.resourceToEmailRate)}
          body="How much of your current active subscriber base came through the lead magnet path."
        />
        <InsightCard
          title="Validation read"
          value={metrics.waitlistCount >= 10 ? "Strong" : "Early"}
          body={metrics.waitlistCount >= 10 ? "Your current waitlist signal is strong enough to justify testing paid validation." : "You still need more waitlist signal before moving into paid validation."}
        />
      </div>

      <div className="admin-grid" style={{ marginTop: 24 }}>
        <section className="activity-card">
          <h2>Resource performance</h2>
          <SimpleTable
            headers={["Resource", "Subscribers", "Conversion share", "Status"]}
            rows={resources.map((resource) => [
              resource.title,
              resource.subscriberCount.toString(),
              formatPercent(resource.conversionRate),
              resource.status
            ])}
          />
        </section>
      </div>
    </AdminShell>
  );
}
