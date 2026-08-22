import { AdminShell, SimpleTable } from "@/components/admin";
import { formatAdminLabel, formatProductLabel } from "@/lib/admin-labels";
import { getProductTrials, getTrialEvents } from "@/lib/db";

export default async function AdminTrialsPage() {
  const [trials, events] = await Promise.all([
    getProductTrials(),
    getTrialEvents()
  ]);

  return (
    <AdminShell title="试用记录">
      <div className="admin-grid" style={{ marginBottom: 24 }}>
        <section className="activity-card">
          <h2>试用窗口</h2>
          <p>公开自助试用使用 7 天窗口。合作预览按线下协作进度推进，并在商品访问里跟踪，不强行放进试用表。</p>
          <SimpleTable
            headers={["创建时间", "商品", "邮箱", "状态", "试用结束", "共建解锁结束", "来源"]}
            rows={trials.map((trial) => [
              trial.created_at.slice(0, 10),
              formatProductLabel(trial.product_slug),
              trial.email,
              formatAdminLabel(trial.status),
              trial.trial_ends_at?.slice(0, 10) ?? "-",
              trial.co_build_unlock_ends_at?.slice(0, 10) ?? "-",
              trial.source_page ?? "-"
            ])}
          />
        </section>
      </div>

      <section className="activity-card">
        <h2>有效试用事件</h2>
        <p>本表已排除 localhost、测试来源、忽略 IP、浏览器退出跟踪访问，以及已配置的内部邮箱。</p>
        <SimpleTable
          headers={["创建时间", "商品", "事件", "邮箱", "路径", "来源"]}
          rows={events.slice(0, 30).map((event) => [
            event.created_at.slice(0, 16).replace("T", " "),
            formatProductLabel(event.product_slug),
            formatAdminLabel(event.event_type),
            event.email ?? "-",
            event.path ?? event.source_page ?? "-",
            event.referrer ?? "-"
          ])}
        />
      </section>
    </AdminShell>
  );
}
