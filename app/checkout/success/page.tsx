import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Payment received"
};

export default async function CheckoutSuccessPage() {
  return (
    <section className="container page-section">
      <div className="section-panel narrow-panel">
        <p className="eyebrow">Payment received</p>
        <h1>Your LeadRadar paid pilot is being activated</h1>
        <p>
          PayPal has confirmed the checkout return. The pilot entitlement is activated from the payment confirmation, then we will use your request details to follow up on setup.
        </p>
        <p>
          You can return to the product page while the webhook finishes processing.
        </p>
        <Link href="/products/leadradar" className="button primary">
          Return to LeadRadar
        </Link>
      </div>
    </section>
  );
}
