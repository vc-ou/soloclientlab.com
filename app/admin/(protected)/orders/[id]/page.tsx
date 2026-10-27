import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin";
import { getOrderFlagLabel, getOrderRow } from "@/lib/domains/commerce";

function money(cents?: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents ?? 0) / 100);
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderRow(id);
  if (!order) notFound();

  const { payment, entitlement, licenseKey, activations } = order;
  const provider = payment.provider;
  const regenerateUrl =
    `/checkout/success?provider=${provider}` +
    `${provider === "paypal" ? `&order_id=${encodeURIComponent(payment.provider_checkout_session_id ?? "")}` : `&session_id=${encodeURIComponent(payment.provider_checkout_session_id ?? "")}`}` +
    `&product=${encodeURIComponent(payment.product_slug)}`;

  return (
    <AdminShell title={`订单 ${payment.id.slice(0, 8)}`}>
      {order.flags.length ? (
        <p className="queue-empty" style={{ borderLeft: "3px solid #c0392b" }}>
          需要处理：{order.flags.map((flag) => getOrderFlagLabel(flag)).join(" / ")}
        </p>
      ) : (
        <p className="queue-empty" style={{ borderLeft: "3px solid #14724f" }}>
          状态正常：已付款、有权益、授权码已发{order.activeActivationCount > 0 ? "且已激活" : "（尚未激活）"}。
        </p>
      )}

      <div className="today-metrics" style={{ marginTop: 16 }}>
        <div className="today-metric">
          <p>金额</p>
          <strong>{money(payment.amount_total, payment.currency ?? "USD")}</strong>
          <span className="metric-hint">{provider} · {payment.status} · 停留 {order.ageHours}h</span>
        </div>
        <div className="today-metric">
          <p>权益</p>
          <strong>{entitlement ? entitlement.status : "无"}</strong>
          <span className="metric-hint">
            {entitlement ? `${entitlement.access_type} · 至 ${entitlement.ends_at ?? "永久"}` : "已付款但没有权益 → 需重放履约"}
          </span>
        </div>
        <div className="today-metric">
          <p>授权码</p>
          <strong>{licenseKey ? `…${licenseKey.key_suffix}` : "无"}</strong>
          <span className="metric-hint">
            {licenseKey ? `上限 ${licenseKey.max_activations} 台 · 已激活 ${order.activeActivationCount}` : "打开下面的成功页链接会自动生成"}
          </span>
        </div>
      </div>

      <h2 style={{ fontSize: 16, marginTop: 22 }}>重发 / 查看授权码</h2>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 8 }}>
        授权码是确定性算出来的：打开这个链接会用同一把码重新生成并展示（可复制后发给客户）。
      </p>
      <p className="order-code">
        <Link href={regenerateUrl} target="_blank" rel="noreferrer">
          {regenerateUrl}
        </Link>
      </p>

      <h2 style={{ fontSize: 16, marginTop: 22 }}>原始标识</h2>
      <p className="order-code">
        checkout_session_id: {payment.provider_checkout_session_id ?? "—"}
        <br />
        payment_intent_id: {payment.provider_payment_intent_id ?? "—"}
        <br />
        客户邮箱: {payment.email ?? "—"}
      </p>

      <h2 style={{ fontSize: 16, marginTop: 22 }}>激活记录（{activations.length}）</h2>
      {activations.length ? (
        <ul className="queue-list">
          {activations.map((activation) => (
            <li key={activation.id} className={activation.status === "active" ? "is-muted" : "is-warn"}>
              <strong>{activation.status}</strong>
              <small>
                激活于 {new Date(activation.activated_at).toISOString().slice(0, 16).replace("T", " ")} ·
                最后校验 {activation.last_verified_at ? new Date(activation.last_verified_at).toISOString().slice(0, 16).replace("T", " ") : "—"} ·
                设备 {activation.device_id_hash.slice(0, 10)}…
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="queue-empty">还没有激活记录。客户可能还没安装扩展，或没拿到授权码。</p>
      )}
    </AdminShell>
  );
}
