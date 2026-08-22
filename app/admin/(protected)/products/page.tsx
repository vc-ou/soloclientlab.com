import Link from "next/link";
import { AdminLinkButton } from "@/components/admin-link-button";
import { AdminShell, MetricCard, SimpleTable } from "@/components/admin";
import { formatAdminLabel } from "@/lib/admin-labels";
import { getAdminProducts } from "@/lib/db";
import type { Product } from "@/lib/types";

function formatUsd(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(cents / 100);
}

function formatEnabled(value: boolean) {
  return value ? "已启用" : "未启用";
}

export default async function AdminProductsPage() {
  const products: Product[] = await getAdminProducts();
  const publishedProducts = products.filter((product) => product.status === "published");
  const paymentEnabledProducts = products.filter((product) => product.payment_enabled);

  return (
    <AdminShell title="商品管理">
      <div className="admin-topbar">
        <p>快速上架预售商品，编辑商品说明、价格、交付方式和发布状态。</p>
        <AdminLinkButton href="/admin/products/new" idleLabel="新建商品" pendingLabel="加载中..." className="button primary" />
      </div>

      <div className="admin-grid metrics">
        <MetricCard label="商品总数" value={products.length} />
        <MetricCard label="已发布" value={publishedProducts.length} />
        <MetricCard label="已启用收款" value={paymentEnabledProducts.length} />
      </div>

      <section className="activity-card" style={{ marginTop: 24 }}>
        <h2>商品列表</h2>
        <SimpleTable
          headers={["商品", "Slug", "状态", "开发阶段", "交付方式", "价格", "收款", "公开页", "编辑"]}
          rows={products.map((product) => [
            <div key={product.id}>
              <strong>{product.name}</strong>
              <p style={{ margin: "4px 0 0" }}>{product.short_description ?? "—"}</p>
            </div>,
            product.slug,
            formatAdminLabel(product.status),
            formatAdminLabel(product.development_status),
            formatAdminLabel(product.delivery_mode),
            formatUsd(product.price_cents, product.currency),
            formatEnabled(product.payment_enabled),
            <Link key={`${product.id}-view`} href={`/products/${product.slug}`} target="_blank" rel="noreferrer">
              打开
            </Link>,
            <Link key={`${product.id}-edit`} href={`/admin/products/${product.id}`}>
              编辑
            </Link>
          ])}
        />
      </section>
    </AdminShell>
  );
}
