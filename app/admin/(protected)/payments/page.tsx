import { AdminShell, MetricCard, SimpleTable } from "@/components/admin";
import { formatAdminLabel, formatProductLabel } from "@/lib/admin-labels";
import { getProductPayments } from "@/lib/db";
import type { ProductPayment } from "@/lib/types";

function formatMoney(amount?: number, currency = "USD") {
  if (typeof amount !== "number") return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(amount / 100);
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function AdminPaymentsPage() {
  const payments = await getProductPayments();
  const paidPayments = payments.filter((payment) => payment.status === "paid");
  const pendingPayments = payments.filter((payment) => payment.status === "pending");

  const rows = payments.map((payment: ProductPayment) => [
    <div key={`${payment.id}-product`}>
      <strong>{formatProductLabel(payment.product_slug)}</strong>
      <p style={{ margin: "4px 0 0" }}>{payment.provider_checkout_session_id ?? "—"}</p>
    </div>,
    formatAdminLabel(payment.provider),
    formatAdminLabel(payment.status),
    payment.email ?? "待回填",
    formatMoney(payment.amount_total ?? payment.amount_subtotal, payment.currency ?? "USD"),
    payment.checkout_url ? (
      <a key={`${payment.id}-checkout`} href={payment.checkout_url} target="_blank" rel="noreferrer">
        打开
      </a>
    ) : (
      "—"
    ),
    formatDateTime(payment.paid_at),
    formatDateTime(payment.created_at)
  ]);

  return (
    <AdminShell title="支付记录">
      <div className="admin-grid metrics">
        <MetricCard label="支付总数" value={payments.length} />
        <MetricCard label="已支付" value={paidPayments.length} />
        <MetricCard label="待确认" value={pendingPayments.length} />
      </div>

      <section className="activity-card" style={{ marginTop: 24 }}>
        <h2>支付列表</h2>
        {payments.length ? (
          <SimpleTable
            headers={["商品", "渠道", "状态", "邮箱", "金额", "链接", "支付时间", "创建时间"]}
            rows={rows}
          />
        ) : (
          <p>暂无支付记录。</p>
        )}
      </section>
    </AdminShell>
  );
}
