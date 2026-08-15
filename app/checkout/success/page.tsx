import type { Metadata } from "next";
import Link from "next/link";
import { ExtensionInstallLink } from "@/components/extension-install-link";
import {
  getLeadRadarExtensionSupportCopy,
  getNeedRadarExtensionSupportCopy,
  hasLeadRadarEdgeAddonsListing,
  hasNeedRadarEdgeAddonsListing
} from "@/lib/extension-links";
import type { ProductSlug } from "@/lib/types";

export const metadata: Metadata = {
  title: "Payment received"
};

function parseProductSlug(value?: string): ProductSlug {
  return value === "needradar-workflow-lab" ? "needradar-workflow-lab" : "leadradar";
}

export default async function CheckoutSuccessPage({
  searchParams
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const params = await searchParams;
  const productSlug = parseProductSlug(params.product);
  const isNeedRadar = productSlug === "needradar-workflow-lab";
  const hasEdgeListing = isNeedRadar ? hasNeedRadarEdgeAddonsListing() : hasLeadRadarEdgeAddonsListing();
  const productName = isNeedRadar ? "NeedRadar" : "LeadRadar";
  const productPath = isNeedRadar ? "/products/needradar-workflow-lab" : "/products/leadradar";
  const extensionSupportCopy = isNeedRadar ? getNeedRadarExtensionSupportCopy() : getLeadRadarExtensionSupportCopy();

  return (
    <section className="container page-section">
      <div className="section-panel narrow-panel">
        <p className="eyebrow">Payment received</p>
        <h1>Your PayPal payment is being confirmed</h1>
        <p>
          PayPal has confirmed the checkout return. Access is activated from the payment confirmation, then setup follow-up can continue from the billing email.
        </p>
        <p>
          {hasEdgeListing
            ? extensionSupportCopy
            : "You can return to the product page while the webhook finishes processing."}
        </p>
        <div className="hero-actions">
          {hasEdgeListing ? (
            <ExtensionInstallLink productSlug={productSlug} sourcePage="/checkout/success" />
          ) : null}
          <Link href={productPath} className={hasEdgeListing ? "button ghost" : "button primary"}>
            Return to {productName}
          </Link>
        </div>
      </div>
    </section>
  );
}
