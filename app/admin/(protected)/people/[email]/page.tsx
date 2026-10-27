import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin";
import { getPersonDetail } from "@/lib/domains/leads";
import { getOrderRows } from "@/lib/domains/commerce";

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toISOString().slice(0, 16).replace("T", " ");
}

export default async function AdminPersonPage({ params }: { params: Promise<{ email: string }> }) {
  const { email } = await params;
  const decoded = decodeURIComponent(email);
  const [{ person, relatedFeedback }, orders] = await Promise.all([getPersonDetail(decoded), getOrderRows()]);

  if (!person) notFound();

  const personOrders = orders.filter(
    (order) => (order.payment.email ?? "").toLowerCase() === person.email.toLowerCase()
  );

  const timeline = [
    ...person.accessRequests.map((r) => ({ at: r.created_at, label: `访问申请 · ${r.access_type} · ${r.product_slug}`, detail: r.use_case ?? r.status })),
    ...person.trials.map((t) => ({ at: t.created_at, label: `试用 · ${t.product_slug} · ${t.status}`, detail: t.trial_ends_at ? `至 ${formatDate(t.trial_ends_at)}` : "" })),
    ...person.configs.map((c) => ({ at: c.created_at, label: `问卷 · ${c.status}`, detail: c.target_market ?? "" }))
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <AdminShell title={person.email}>
      <div className="today-metrics">
        <div className="today-metric">
          <p>建议动作</p>
          <strong style={{ fontSize: 18 }}>{person.suggestedAction}</strong>
          <span className="metric-hint">按「有没有待回应的事」推导</span>
        </div>
        <div className="today-metric">
          <p>首次出现 / 最近活动</p>
          <strong style={{ fontSize: 18 }}>{formatDate(person.firstSeenAt).slice(0, 10)}</strong>
          <span className="metric-hint">最近 {formatDate(person.lastSeenAt)}</span>
        </div>
        <div className="today-metric">
          <p>订单</p>
          <strong>{personOrders.length}</strong>
          <span className="metric-hint">
            {personOrders.filter((o) => o.payment.status === "paid").length} 笔已付
          </span>
        </div>
      </div>

      <h2 style={{ fontSize: 16, marginTop: 22 }}>来源与标签</h2>
      <p className="order-code">
        来源：{person.sourceType ?? "—"} {person.sourcePage ? `· ${person.sourcePage}` : ""}
        <br />
        标签：{[...person.personaTags, ...person.topicTags, ...person.interests].join(" / ") || "—"}
        <br />
        备注：{person.note ?? "—"}
      </p>

      <h2 style={{ fontSize: 16, marginTop: 22 }}>事件时间线（{timeline.length}）</h2>
      {timeline.length ? (
        <ul className="queue-list">
          {timeline.map((item, index) => (
            <li key={`${item.at}-${index}`} className="is-muted">
              <strong>{item.label}</strong>
              <small>
                {formatDate(item.at)} {item.detail ? `· ${item.detail}` : ""}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="queue-empty">只有订阅记录，没有申请/试用/问卷。</p>
      )}

      <h2 style={{ fontSize: 16, marginTop: 22 }}>相关订单（{personOrders.length}）</h2>
      {personOrders.length ? (
        <ul className="queue-list">
          {personOrders.map((order) => (
            <li key={order.payment.id} className={order.flags.length ? "is-warn" : "is-muted"}>
              <Link href={`/admin/orders/${order.payment.id}`}>
                {order.payment.product_slug} · {order.payment.status}
              </Link>
              <small>
                {formatDate(order.payment.created_at)} · {order.flags.length ? order.flags.join(" / ") : "正常"}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="queue-empty">没有订单记录。</p>
      )}

      <h2 style={{ fontSize: 16, marginTop: 22 }}>来源页反馈（旁证，feedback 无邮箱无法归人）</h2>
      {relatedFeedback.length ? (
        <ul className="queue-list">
          {relatedFeedback.map((entry) => (
            <li key={entry.id} className="is-muted">
              <strong>{entry.is_useful ? "有用" : "没用"} · {entry.tool_slug}</strong>
              <small>
                {formatDate(entry.created_at)} · {entry.problem_context.slice(0, 120)}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="queue-empty">该来源页暂无反馈。</p>
      )}
    </AdminShell>
  );
}
