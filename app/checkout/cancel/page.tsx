import type { Metadata } from "next";
import Link from "next/link";
import { getProductBySlug } from "@/lib/db";
import type { ProductSlug } from "@/lib/types";

export const metadata: Metadata = {
  title: "Checkout canceled"
};

function parseProductSlug(value?: string): ProductSlug {
  return value === "needradar-workflow-lab" ? "needradar-workflow-lab" : "leadradar";
}

export default async function CheckoutCancelPage({
  searchParams
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const params = await searchParams;
  const productSlug = parseProductSlug(params.product);
  const product = await getProductBySlug(productSlug);
  const productPath = product ? `/products/${product.slug}` : "/products";
  const productName = product?.name ?? "商品";

  return (
    <section className="container page-section">
      <div className="section-panel narrow-panel">
        <p className="eyebrow">Checkout canceled</p>
        <h1>No payment was taken</h1>
        <p>
          Your payment was not completed. Return to the product page to restart checkout; the install link appears only after payment confirmation.
        </p>
        <div className="hero-actions">
          <Link href={productPath} className="button primary">
            Return to {productName}
          </Link>
        </div>
      </div>
    </section>
  );
}
