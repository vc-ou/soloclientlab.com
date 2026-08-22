import { AdminShell, MetricCard } from "@/components/admin";
import { getDashboardMetrics } from "@/lib/db";

export default async function AdminOverviewPage() {
  const metrics = await getDashboardMetrics();

  return (
    <AdminShell title="后台总览">
      <div className="admin-grid metrics">
        <MetricCard label="已发布文章" value={metrics.publishedPosts} />
        <MetricCard label="商品页访问" value={metrics.productPageViews} />
        <MetricCard label="试用访问请求" value={metrics.trialAccessClicks} />
      </div>
    </AdminShell>
  );
}
