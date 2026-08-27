import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell, FormActions } from "@/components/admin";
import { ProductEditorFields } from "@/components/product-editor-fields";
import { upsertProduct } from "@/lib/actions";
import { getAdminProducts, getProductById } from "@/lib/db";

type ProductEditorProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function ProductEditorPage({ params, searchParams }: ProductEditorProps) {
  const { id } = await params;
  const { error } = await searchParams;
  const product = id === "new" ? null : await getProductById(id);
  if (id !== "new" && !product) {
    notFound();
  }
  const products = await getAdminProducts();
  const formatUsd = (cents: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency
    }).format(cents / 100);

  return (
    <AdminShell title={product ? "编辑商品" : "新建商品"}>
      <form action={upsertProduct} className="admin-form">
        {error ? <p className="admin-action-feedback">{decodeURIComponent(error)}</p> : null}
        <input type="hidden" name="id" value={product?.id ?? ""} />
        <ProductEditorFields product={product} />

        {product ? (
          <section className="admin-card resource-preview-card">
            <div className="resource-preview-header">
              <div>
                <h2>商品预览</h2>
                <p>检查公开页面、价格和状态是否一致。</p>
              </div>
              <span className="admin-pill">{product.payment_enabled ? "已启用收款" : "未启用收款"}</span>
            </div>
            <div className="resource-preview-links">
              <Link href={`/products/${product.slug}`} target="_blank" rel="noreferrer" className="button secondary">
                打开公开页
              </Link>
              {product.landing_page_url ? (
                <Link href={product.landing_page_url} target="_blank" rel="noreferrer" className="button ghost">
                  打开落地页
                </Link>
              ) : null}
            </div>
            <div className="resource-preview-stats">
              <div>
                <strong>{formatUsd(product?.price_cents ?? 0, product?.currency ?? "USD")}</strong>
                <span>价格</span>
              </div>
              <div>
                <strong>{products.length}</strong>
                <span>总商品数</span>
              </div>
            </div>
          </section>
        ) : null}

        <FormActions />
      </form>
    </AdminShell>
  );
}
