import { AdminShell, MetricCard } from "@/components/admin";
import { getDashboardMetrics } from "@/lib/db";

export default async function AdminMetricsPage() {
  const metrics = await getDashboardMetrics();

  return (
    <AdminShell title="产品验证漏斗">
      <div className="admin-grid metrics">
        <MetricCard label="研究内容访问" value={metrics.researchViews} />
        <MetricCard label="商品页访问" value={metrics.productPageViews} />
        <MetricCard label="试用访问请求" value={metrics.trialAccessClicks} />
        <MetricCard label="校准反馈" value={metrics.feedbackCount} />
      </div>
    </AdminShell>
  );
}
