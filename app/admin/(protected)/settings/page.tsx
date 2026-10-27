import Link from "next/link";
import { AdminShell } from "@/components/admin";
import { AnalyticsOptOutControl } from "@/components/analytics-opt-out-control";
import { SyncCodeProductsButton } from "@/components/sync-code-products-button";
import { syncCodeProducts } from "@/lib/actions";

export default async function AdminSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ sync?: string; inserted?: string; updated?: string; total?: string; message?: string }>;
}) {
  const params = await searchParams;

  const envState = [
    ["DATABASE_URL", Boolean(process.env.DATABASE_URL)],
    ["LICENSE_SIGNING_SECRET", Boolean(process.env.LICENSE_SIGNING_SECRET)],
    ["PAYPAL_ENV", Boolean(process.env.PAYPAL_ENV)],
    ["NEXT_PUBLIC_SUPABASE_URL", Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)],
    ["NEXT_PUBLIC_UMAMI_WEBSITE_ID", Boolean(process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID)]
  ] as const;

  return (
    <AdminShell title="设置">
      <section className="activity-card">
        <h2>导出</h2>
        <p className="metric-hint" style={{ marginBottom: 12 }}>
          客户表已按邮箱聚合 5 张线索表；订单表包含权益、授权码与激活数。
        </p>
        <div className="order-links">
          <Link href="/admin/export?type=people" className="button ghost">
            导出客户 CSV
          </Link>
          <Link href="/admin/export?type=orders" className="button ghost">
            导出订单 CSV
          </Link>
        </div>
      </section>

      <section className="activity-card" style={{ marginTop: 20 }}>
        <h2>分析</h2>
        <p className="metric-hint" style={{ marginBottom: 12 }}>
          浏览器级退订：开启后本机不再加载 Umami，也不会写入站内事件。
        </p>
        <AnalyticsOptOutControl />
      </section>

      <section className="activity-card" style={{ marginTop: 20 }}>
        <h2>系统状态（只读）</h2>
        <SimpleEnvList items={envState} />
        <p className="metric-hint" style={{ marginTop: 10 }}>
          只显示「是否配置」，不显示具体值。
        </p>
      </section>

      <section className="activity-card" style={{ marginTop: 20 }}>
        <h2>危险操作</h2>
        <p className="metric-hint" style={{ marginBottom: 12 }}>
          「同步代码商品」会用 lib/seed.ts 覆盖数据库里的商品名称、文案、价格、开发阶段与收款开关。
          线上价格目前低于 seed 里的值，执行后会被改回。非必要不要点。
        </p>
        {params.sync === "success" ? (
          <p className="admin-action-feedback success">
            已同步：新增 {params.inserted ?? "0"} 个，更新 {params.updated ?? "0"} 个，共 {params.total ?? "0"} 个。
          </p>
        ) : null}
        {params.sync === "error" ? (
          <p className="admin-action-feedback">{params.message ?? "同步失败，请稍后重试。"}</p>
        ) : null}
        <SyncCodeProductsButton action={syncCodeProducts} />
      </section>
    </AdminShell>
  );
}

function SimpleEnvList({ items }: { items: ReadonlyArray<readonly [string, boolean]> }) {
  return (
    <ul className="queue-list">
      {items.map(([name, configured]) => (
        <li key={name} className={configured ? "is-muted" : "is-warn"}>
          <strong>{name}</strong>
          <small>{configured ? "已配置" : "未配置 —— 相关功能会降级或报错"}</small>
        </li>
      ))}
    </ul>
  );
}
