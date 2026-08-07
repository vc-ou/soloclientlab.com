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
          Your subscription was not started. You can return to checkout whenever you are ready.
        </p>
        <Link href="/products/leadradar#subscription" className="button primary">
          Return to subscription
        </Link>
      </div>
    </section>
  );
}
