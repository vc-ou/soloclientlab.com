import type { Metadata } from "next";
import Link from "next/link";
import { ExtensionInstallLink } from "@/components/extension-install-link";
import { getProductPaymentByProviderCheckoutSessionId } from "@/lib/db";
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
  searchParams: Promise<{ order_id?: string; product?: string }>;
}) {
  const params = await searchParams;
  const productSlug = parseProductSlug(params.product);
  const isNeedRadar = productSlug === "needradar-workflow-lab";
  const hasEdgeListing = isNeedRadar ? hasNeedRadarEdgeAddonsListing() : hasLeadRadarEdgeAddonsListing();
  const productName = isNeedRadar ? "NeedRadar" : "LeadRadar";
  const productPath = isNeedRadar ? "/products/needradar-workflow-lab" : "/products/leadradar";
  const extensionSupportCopy = isNeedRadar ? getNeedRadarExtensionSupportCopy() : getLeadRadarExtensionSupportCopy();
  const orderId = typeof params.order_id === "string" ? params.order_id : undefined;
  let hasPaidAccess = false;

  if (orderId) {
    try {
      const payment = await getProductPaymentByProviderCheckoutSessionId(orderId);
      hasPaidAccess = payment?.status === "paid" && payment.product_slug === productSlug;
    } catch (error) {
      console.error(`Failed to verify paid access for checkout success order ${orderId}:`, error);
    }
  }

  return (
    <section className="container page-section">
      <div className="section-panel narrow-panel">
        <p className="eyebrow">Payment received</p>
        <h1>{hasPaidAccess ? "Your PayPal payment is confirmed" : "Your PayPal payment is being confirmed"}</h1>
        <p>
          {hasPaidAccess
            ? "PayPal has confirmed the payment. You can install now, and setup follow-up can continue from the billing email."
            : "We could not verify a completed payment for this page yet. Return to the product page to restart checkout if needed."}
        </p>
        <p>
          {hasPaidAccess && hasEdgeListing
            ? extensionSupportCopy
            : "You can return to the product page while the webhook finishes processing."}
        </p>
        <div className="hero-actions">
          {hasPaidAccess && hasEdgeListing ? (
            <ExtensionInstallLink productSlug={productSlug} sourcePage="/checkout/success" />
          ) : null}
          <Link href={productPath} className={hasPaidAccess && hasEdgeListing ? "button ghost" : "button primary"}>
            Return to {productName}
          </Link>
        </div>
      </div>
    </section>
  );
}
