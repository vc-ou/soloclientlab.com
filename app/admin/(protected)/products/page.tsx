import { AdminLinkButton } from "@/components/admin-link-button";
import { AdminShell, MetricCard } from "@/components/admin";
import { AdminProductsTable } from "@/components/admin-products-table";
import { SyncCodeProductsButton } from "@/components/sync-code-products-button";
import { syncCodeProducts } from "@/lib/actions";
import { getAdminProducts } from "@/lib/db";
import type { Product } from "@/lib/types";

type AdminProductsPageProps = {
  searchParams: Promise<{ sync?: string; inserted?: string; updated?: string; total?: string; message?: string }>;
};

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const params = await searchParams;
  const products: Product[] = await getAdminProducts();
  const publishedProducts = products.filter((product) => product.status === "published");
  const paymentEnabledProducts = products.filter((product) => product.payment_enabled);

  return (
    <AdminShell title="商品管理">
      <div className="admin-topbar">
        <p>快速上架预售商品，编辑商品说明、价格、交付方式和发布状态。</p>
        <div className="admin-topbar-actions">
          <SyncCodeProductsButton action={syncCodeProducts} />
          <AdminLinkButton href="/admin/products/new" idleLabel="新建商品" pendingLabel="加载中..." className="button primary" />
        </div>
      </div>

      {params.sync === "success" ? (
        <p className="admin-action-feedback success">
          已同步代码商品：新增 {params.inserted ?? "0"} 个，更新 {params.updated ?? "0"} 个，共 {params.total ?? "0"} 个。
        </p>
      ) : null}
      {params.sync === "error" ? <p className="admin-action-feedback">{params.message ?? "代码商品同步失败，请稍后重试。"}</p> : null}

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
