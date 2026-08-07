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
          Your paid pilot request is still available for follow-up. You can return to checkout whenever you are ready.
        </p>
        <Link href="/products/leadradar#paid-pilot" className="button primary">
          Return to paid pilot
        </Link>
      </div>
    </section>
  );
}
