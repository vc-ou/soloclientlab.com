import { ActivityList, AdminShell, MetricCard } from "@/components/admin";
import { getDashboardMetrics } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function AdminOverviewPage() {
  const metrics = await getDashboardMetrics();

  return (
    <AdminShell title="Overview">
      <div className="admin-grid metrics">
        <MetricCard label="Total demands" value={metrics.totalDemands} />
        <MetricCard label="Published posts" value={metrics.publishedPosts} />
        <MetricCard label="Total subscribers" value={metrics.totalSubscribers} hint={`${metrics.activeSubscribers} active`} />
        <MetricCard label="Qualified subscribers" value={metrics.qualifiedSubscribers} />
        <MetricCard label="Secondary page signups" value={metrics.resourceSignups} />
        <MetricCard label="Waitlist count" value={metrics.waitlistCount} />
      </div>
      <div className="admin-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", marginTop: 24 }}>
        <ActivityList
          title="Latest subscribers"
          items={metrics.latestSubscribers.map((item) => ({
            primary: item.email,
            secondary: `${item.source_type ?? "unknown"}${item.persona_tag ? ` · ${item.persona_tag}` : ""}`,
            meta: formatDate(item.created_at)
          }))}
        />
        <ActivityList
          title="Latest waitlist entries"
          items={metrics.latestWaitlists.map((item) => ({
            primary: item.email,
            secondary: `${item.project_name}${item.interest_tag ? ` · ${item.interest_tag}` : ""}`,
            meta: formatDate(item.created_at)
          }))}
        />
        <ActivityList
          title="Latest demands"
          items={metrics.latestDemands.map((item) => ({
            primary: item.title,
            secondary: item.status,
            meta: formatDate(item.created_at)
          }))}
        />
      </div>
    </AdminShell>
  );
}
