import type { Metadata } from "next";
import Link from "next/link";
import { ExtensionInstallLink } from "@/components/extension-install-link";
import { ensureProductLicenseKey, getPaidProductLicenseAccessByCheckoutSessionId } from "@/lib/domains/commerce";
import {
  getLeadRadarExtensionSupportCopy,
  getNeedRadarExtensionSupportCopy,
  hasLeadRadarEdgeAddonsListing,
  hasNeedRadarEdgeAddonsListing
} from "@/lib/extension-links";
import { buildLicenseKey, getLicenseKeySuffix, hashLicenseSecret, isLicensedProduct } from "@/lib/licenses";
import { getProductBySlug } from "@/lib/domains/catalog";
import type { ProductSlug } from "@/lib/types";

export const metadata: Metadata = {
  title: "Payment received"
};

function parseProductSlug(value?: string): ProductSlug {
  return isLicensedProduct(value) ? value : "leadradar";
}

export default async function CheckoutSuccessPage({
  searchParams
}: {
  searchParams: Promise<{
    order_id?: string;
    session_id?: string;
    provider?: string;
    product?: string;
  }>;
}) {
  const params = await searchParams;
  const productSlug = parseProductSlug(params.product);
  const product = await getProductBySlug(productSlug);
  const isNeedRadar = product?.slug === "needradar-workflow-lab";
  const hasEdgeListing = isNeedRadar ? hasNeedRadarEdgeAddonsListing() : product?.slug === "leadradar" ? hasLeadRadarEdgeAddonsListing() : false;
  const productName = product?.name ?? "the product";
  const productPath = product ? `/products/${product.slug}` : "/products";
  const extensionSupportCopy = isNeedRadar
    ? getNeedRadarExtensionSupportCopy()
    : product?.slug === "leadradar"
      ? getLeadRadarExtensionSupportCopy()
      : "Payment has been confirmed. Return to the product page for the current install or access instructions.";
  // PayPal 回跳带 order_id，命中 product_payments.provider_checkout_session_id。
  const checkoutSessionId = typeof params.order_id === "string" && params.order_id ? params.order_id : undefined;
  const providerLabel = "PayPal";
  let hasPaidAccess = false;
  let licenseKey: string | undefined;

  if (checkoutSessionId) {
    try {
      const access = await getPaidProductLicenseAccessByCheckoutSessionId(checkoutSessionId, productSlug);
      hasPaidAccess = Boolean(access);
      if (access) {
        licenseKey = buildLicenseKey(productSlug, access.payment.id, access.entitlement.id);
        await ensureProductLicenseKey({
          product_slug: productSlug,
          entitlement_id: access.entitlement.id,
          source_payment_id: access.payment.id,
          key_hash: hashLicenseSecret(licenseKey),
          key_suffix: getLicenseKeySuffix(licenseKey),
          max_activations: 1
        });
      }
    } catch (error) {
      console.error(`Failed to verify paid access for checkout session ${checkoutSessionId}:`, error);
    }
  }

  return (
    <section className="container page-section">
      <div className="section-panel narrow-panel">
        <p className="eyebrow">Payment received</p>
        <h1>
          {hasPaidAccess
            ? `Your ${providerLabel} payment is confirmed`
            : `Your ${providerLabel} payment is being confirmed`}
        </h1>
        <p>
          {hasPaidAccess
            ? `${providerLabel} has confirmed the payment. You can install now, and setup follow-up can continue from the billing email.`
            : "We could not verify a completed payment for this page yet. Return to the product page to restart checkout if needed."}
        </p>
        <p>
          {hasPaidAccess && hasEdgeListing
            ? extensionSupportCopy
            : "You can return to the product page while the webhook finishes processing."}
        </p>
        {hasPaidAccess && licenseKey ? (
          <div className="license-key-panel">
            <p className="eyebrow">Extension license key</p>
            <code>{licenseKey}</code>
            <p>Install the extension, then paste this key on first launch. One payment activates one device.</p>
          </div>
        ) : null}
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
