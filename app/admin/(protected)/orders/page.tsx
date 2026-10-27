import Link from "next/link";
import { AdminShell, SimpleTable } from "@/components/admin";
import { getOrderFlagLabel, getOrderRows } from "@/lib/domains/commerce";

function money(cents?: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents ?? 0) / 100);
}

function flagTone(flag: string) {
  if (flag === "paid_without_entitlement") return "is-danger";
  if (flag === "entitlement_without_key" || flag === "key_never_activated") return "is-warn";
  return "is-muted";
}

export default async function AdminOrdersPage() {
  const orders = await getOrderRows();
  const needsAttention = orders.filter((order) => order.flags.length > 0).length;
  const pendingTotal = orders
    .filter((order) => order.payment.status === "pending")
    .reduce((sum, order) => sum + (order.payment.amount_total ?? 0), 0);

  return (
    <AdminShell title="订单">
      <div className="today-metrics">
        <div className="today-metric">
          <p>订单总数</p>
          <strong>{orders.length}</strong>
          <span className="metric-hint">按「异常优先」排序</span>
        </div>
        <div className="today-metric">
          <p>需要处理</p>
          <strong>{needsAttention}</strong>
          <span className="metric-hint">已付款无权益 / 有权益无码 / 发码未激活 / 待付款超时</span>
        </div>
        <div className="today-metric">
          <p>待付款金额</p>
          <strong>{money(pendingTotal)}</strong>
          <span className="metric-hint">pending 状态的合计，可能是放弃也可能卡住了</span>
        </div>
      </div>

      <SimpleTable
        headers={["下单时间", "商品", "渠道", "状态", "金额", "邮箱", "停留", "权益", "授权码", "激活", "标记", "操作"]}
        rows={orders.map((order) => [
          new Date(order.payment.created_at).toISOString().slice(0, 16).replace("T", " "),
          order.payment.product_slug,
          order.payment.provider,
          order.payment.status,
          money(order.payment.amount_total, order.payment.currency ?? "USD"),
          order.payment.email ?? "—",
          `${order.ageHours}h`,
          order.entitlement ? order.entitlement.status : "—",
          order.licenseKey ? `…${order.licenseKey.key_suffix}` : "—",
          order.licenseKey ? `${order.activeActivationCount}/${order.licenseKey.max_activations}` : "—",
          order.flags.length ? (
            <span>
              {order.flags.map((flag) => (
                <span className={`flag ${flagTone(flag)}`} key={flag}>
                  {getOrderFlagLabel(flag)}
                </span>
              ))}
            </span>
          ) : (
            <span className="flag is-ok">正常</span>
          ),
          <Link key={order.payment.id} href={`/admin/orders/${order.payment.id}`}>
            详情
          </Link>
        ])}
      />

      {orders.length === 0 ? <p className="queue-empty">还没有任何订单记录。</p> : null}
    </AdminShell>
  );
}
