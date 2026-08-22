"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SimpleTable } from "@/components/admin";
import { removeProduct } from "@/lib/actions";
import { formatAdminLabel } from "@/lib/admin-labels";
import type { ActionState, Product } from "@/lib/types";

const initialDeleteState: ActionState = {
  success: false,
  message: ""
};

function formatUsd(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(cents / 100);
}

function formatEnabled(value: boolean) {
  return value ? "已启用" : "未启用";
}

function DeleteProductButton({
  productId,
  onDeleted
}: {
  productId: string;
  onDeleted: (productId: string) => void;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(removeProduct, initialDeleteState);

  useEffect(() => {
    if (!state.success) return;

    onDeleted(productId);
    router.refresh();
  }, [onDeleted, productId, router, state.success]);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("确定删除这个商品吗？此操作不可撤销。")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={productId} />
      <button
        type="submit"
        className={`button ghost button-sm button-danger ${pending ? "is-pending" : ""}`.trim()}
        aria-busy={pending}
        disabled={pending}
      >
        {pending ? <span className="button-spinner" aria-hidden="true" /> : null}
        <span>{pending ? "删除中..." : "删除"}</span>
      </button>
      {state.message && !state.success ? <p className="admin-action-feedback">{state.message}</p> : null}
    </form>
  );
}

export function AdminProductsTable({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);

  return (
    <SimpleTable
      headers={["商品", "Slug", "状态", "开发阶段", "交付方式", "价格", "收款", "公开页", "编辑", "删除"]}
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
        </Link>,
        <DeleteProductButton
          key={`${product.id}-delete`}
          productId={product.id}
          onDeleted={(deletedProductId) => {
            setProducts((currentProducts) => currentProducts.filter((currentProduct) => currentProduct.id !== deletedProductId));
          }}
        />
      ])}
    />
  );
}
