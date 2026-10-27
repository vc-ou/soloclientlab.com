import { AdminShell, MetricCard } from "@/components/admin";
import { AdminLinkButton } from "@/components/admin-link-button";
import { AdminProductsTable } from "@/components/admin-products-table";
import { getAdminProducts } from "@/lib/domains/catalog";

export default async function AdminCatalogPage() {
  const products = await getAdminProducts();

  return (
    <AdminShell title="商品">
      <div className="admin-topbar">
        <p>商品、价格与上架状态。改动会影响公开商品页与收款金额。</p>
        <AdminLinkButton href="/admin/catalog/new" idleLabel="新建商品" pendingLabel="加载中..." className="button primary" />
      </div>

      <div className="admin-grid metrics">
        <MetricCard label="商品总数" value={products.length} />
        <MetricCard label="已发布" value={products.filter((p) => p.status === "published").length} />
        <MetricCard label="已启用收款" value={products.filter((p) => p.payment_enabled).length} />
      </div>

      <section className="activity-card" style={{ marginTop: 24 }}>
        <h2>商品列表</h2>
        <AdminProductsTable initialProducts={products} />
      </section>

      <p className="metric-hint" style={{ marginTop: 16 }}>
        注意：后台的「同步代码商品」在设置页，它会把 lib/seed.ts 的价格与状态覆盖回数据库。
      </p>
    </AdminShell>
  );
}
