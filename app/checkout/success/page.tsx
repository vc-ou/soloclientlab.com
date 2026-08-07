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
        <h1>Your PayPal payment is being confirmed</h1>
        <p>
          PayPal has confirmed the checkout return. Access is activated from the payment confirmation, then setup follow-up can continue from the billing email.
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
