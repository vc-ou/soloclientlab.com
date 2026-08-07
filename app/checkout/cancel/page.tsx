import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Checkout canceled"
};

export default function CheckoutCancelPage() {
  return (
    <section className="container page-section">
      <div className="section-panel narrow-panel">
        <p className="eyebrow">Checkout canceled</p>
        <h1>No payment was taken</h1>
        <p>
          Your payment was not completed. You can return to PayPal checkout whenever you are ready.
        </p>
        <Link href="/products/leadradar#subscription" className="button primary">
          Return to PayPal checkout
        </Link>
      </div>
    </section>
  );
}
