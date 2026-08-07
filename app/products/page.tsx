import type { Metadata } from "next";
import Link from "next/link";
import { PayPalCheckoutButton } from "@/components/paypal-checkout-button";
import { PageHero, SectionHeading } from "@/components/site";

export const metadata: Metadata = {
  title: "Tools | SoloClientLab",
  description: "Focused tools for finding opportunities, reviewing signals, and making independent work easier to run.",
  alternates: {
    canonical: "/products"
  }
};

export default function ProductsPage() {
  return (
    <>
      <PageHero
        align="center"
        className="public-route-hero products-route-hero"
        eyebrow="Tools"
        title="Focused tools for recurring solo-work problems"
        description="Each tool focuses on one clear workflow, with enough context to help you decide whether it deserves a place in your work."
      />

      <section className="container">
        <div className="section-panel route-section">
          <SectionHeading title="Available tools" />
          <div className="product-card">
            <div>
              <p className="eyebrow">Beta · Access requests open</p>
              <h2>LeadRadar for CNC / Manufacturing</h2>
              <p>
                Find and review sourcing, quotation, sample, MOQ, and capacity signals from social conversations before
                they disappear into manual scanning.
              </p>
              <p className="form-feedback">Microsoft Edge Add-ons listing is under review. PayPal checkout is open now.</p>
            </div>
            <div className="hero-actions product-card-actions">
              <PayPalCheckoutButton sourcePage="/products#leadradar">
                Request LeadRadar access
              </PayPalCheckoutButton>
              <Link href="/tools/leadradar" className="button ghost">
                Open the demo
              </Link>
            </div>
          </div>
          <div className="product-card" style={{ marginTop: 20 }}>
            <div>
              <p className="eyebrow">Workflow lab · In progress</p>
              <h2>NeedRadar Workflow Lab</h2>
              <p>
                A lightweight workflow lab for turning public comments, search queries, and field notes into clearer
                need clusters before a product is built.
              </p>
              <p className="form-feedback">PayPal checkout is open now. The official install path will appear here when the listing is live.</p>
            </div>
            <div className="hero-actions product-card-actions">
              <PayPalCheckoutButton productSlug="needradar-workflow-lab" sourcePage="/products#needradar-workflow-lab">
                Request NeedRadar access
              </PayPalCheckoutButton>
              <Link href="/products/needradar-workflow-lab" className="button ghost">
                View product details
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
