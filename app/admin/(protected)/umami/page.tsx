import { AnalyticsOptOutControl } from "@/components/analytics-opt-out-control";
import { AdminShell } from "@/components/admin";

const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const umamiDashboardUrl = process.env.UMAMI_DASHBOARD_URL ?? "https://cloud.umami.is";

export default function AdminUmamiPage() {
  const trackingConfigured = Boolean(umamiWebsiteId);

  return (
    <AdminShell title="Umami 分析">
      <div className="admin-toolbar">
        <div>
          <p className="eyebrow">免费方案模式</p>
          <p className="admin-toolbar-copy">
            打开 Umami Cloud 查看流量、事件和实时活动。
          </p>
        </div>
        <a href={umamiDashboardUrl} className="button primary" target="_blank" rel="noreferrer">
          打开 Umami Cloud
        </a>
      </div>

      {!trackingConfigured ? (
        <section className="empty-state-card" style={{ marginTop: 24 }}>
          <p className="eyebrow">需要设置</p>
          <h2>接入 Umami 跟踪脚本</h2>
          <p>
            在 Vercel 中添加 `NEXT_PUBLIC_UMAMI_WEBSITE_ID`，值来自 Umami Cloud 的跟踪代码里的站点 ID。
            免费方案不需要 API key。
          </p>
        </section>
      ) : null}

      <div style={{ marginTop: 24 }}>
        <AnalyticsOptOutControl />
      </div>
    </AdminShell>
  );
}
