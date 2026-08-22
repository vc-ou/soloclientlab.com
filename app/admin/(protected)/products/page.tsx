import { AdminLinkButton } from "@/components/admin-link-button";
import { AdminShell, MetricCard } from "@/components/admin";
import { AdminProductsTable } from "@/components/admin-products-table";
import { getAdminProducts } from "@/lib/db";
import type { Product } from "@/lib/types";

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
        <AdminProductsTable initialProducts={products} />
      </section>
    </AdminShell>
  );
}
