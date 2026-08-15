import type { Metadata } from "next";
import Link from "next/link";
import { ExtensionInstallLink } from "@/components/extension-install-link";
import {
  hasLeadRadarEdgeAddonsListing,
  hasNeedRadarEdgeAddonsListing
} from "@/lib/extension-links";
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
  const isNeedRadar = productSlug === "needradar-workflow-lab";
  const hasEdgeListing = isNeedRadar ? hasNeedRadarEdgeAddonsListing() : hasLeadRadarEdgeAddonsListing();
  const productPath = isNeedRadar ? "/products/needradar-workflow-lab#product-access" : "/products/leadradar#subscription";
  const productName = isNeedRadar ? "NeedRadar" : "LeadRadar";

  return (
    <section className="container page-section">
      <div className="section-panel narrow-panel">
        <p className="eyebrow">Checkout canceled</p>
        <h1>No payment was taken</h1>
        <p>
          Your payment was not completed. You can return to the product page or install the extension if the store listing is live.
        </p>
        <div className="hero-actions">
          {hasEdgeListing ? (
            <ExtensionInstallLink productSlug={productSlug} sourcePage="/checkout/cancel" />
          ) : null}
          <Link href={productPath} className={hasEdgeListing ? "button ghost" : "button primary"}>
            Return to {productName}
          </Link>
        </div>
      </div>
    </section>
  );
}
