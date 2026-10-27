import type { Metadata } from "next";
import Link from "next/link";
import { getProductBySlug } from "@/lib/domains/catalog";
import type { ProductSlug } from "@/lib/types";

export const metadata: Metadata = {
  title: "Checkout canceled"
};

function parseProductSlug(value?: string): ProductSlug {
  return value === "needradar-workflow-lab" ? "needradar-workflow-lab" : "leadradar";
}

/**
 * 各支付 Action 在失败时都会带 `reason=`，但页面以前完全忽略它，
 * 访客只能看到一句通用文案。这里给出可读的原因，便于访客判断要不要重试。
 */
const REASON_COPY: Record<string, string> = {
  missing_paypal_order:
    "PayPal did not return an order reference. Start the checkout again from the product page.",
  invalid_paypal_request:
    "The checkout request was incomplete. Start the checkout again from the product page.",
  paypal_checkout_failed:
    "We could not reach PayPal to create the order. Wait a moment, then try again.",
  missing_paypal_approval_url:
    "PayPal created the order but did not return an approval link. Try again, or contact us if it keeps happening.",
  paypal_capture_failed:
    "PayPal could not confirm the payment. If a charge does appear, contact us and we will finish the activation manually.",
  product_not_available:
    "This product is not open for checkout right now. Contact us if you were expecting it to be available.",
  invalid_subscription_request:
    "The subscription request was incomplete. Start the checkout again from the product page.",
  subscription_checkout_failed:
    "We could not start the card checkout. Wait a moment, then try again.",
  missing_checkout_url:
    "The payment provider did not return a checkout link. Try again, or contact us if it keeps happening."
};

const FALLBACK_REASON =
  "Your payment was not completed. No charge was made, and nothing was activated.";

export default async function CheckoutCancelPage({
  searchParams
}: {
  searchParams: Promise<{ product?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const productSlug = parseProductSlug(params.product);
  const product = await getProductBySlug(productSlug);
  const productPath = product ? `/products/${product.slug}` : "/products";
  const productName = product?.name ?? "the product";
  const reason = typeof params.reason === "string" ? params.reason : undefined;
  const reasonCopy = (reason && REASON_COPY[reason]) || FALLBACK_REASON;

  return (
    <section className="container page-section">
      <div className="section-panel narrow-panel">
        <p className="eyebrow">Checkout canceled</p>
        <h1>No payment was taken</h1>
        <p>{reasonCopy}</p>
        <p>
          Return to the product page to restart checkout; the install link appears only after payment
          confirmation. If you were charged and this page still appears, email{" "}
          <a href="mailto:soloclientlab.com@gmail.com">soloclientlab.com@gmail.com</a>.
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
