import type { Metadata } from "next";
import Link from "next/link";
import { PayPalCheckoutButton } from "@/components/paypal-checkout-button";
import { PageHero, SectionHeading } from "@/components/site";

export const metadata: Metadata = {
  title: {
    absolute: "Client Acquisition Tools for Solo Consultants | SoloClientLab"
  },
  description:
    "Explore lightweight tools that help solo consultants and small service businesses find public demand signals, research client needs, and turn scattered conversations into repeatable lead workflows.",
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
        title="Client acquisition tools for solo consultants and small service businesses"
        description="Each tool focuses on one clear workflow, with enough context to help you decide whether it deserves a place in your work."
      />

      <section className="container">
        <div className="section-panel route-section">
          <SectionHeading title="Available tools" />
          <div className="product-card">
            <div>
              <p className="eyebrow">Paid Edge extension access</p>
              <h2>LeadRadar for CNC / Manufacturing</h2>
              <p>
                Find and review sourcing, quotation, sample, MOQ, and capacity signals from social conversations before
                they disappear into manual scanning.
              </p>
              <p className="form-feedback">
                PayPal checkout is required before the install link is shown.
              </p>
            </div>
            <div className="hero-actions product-card-actions">
              <PayPalCheckoutButton sourcePage="/products#leadradar">
                Pay for LeadRadar access
              </PayPalCheckoutButton>
              <Link href="/tools/leadradar" className="button ghost">
                Open the demo
              </Link>
            </div>
          </div>
          <div className="product-card" style={{ marginTop: 20 }}>
            <div>
              <p className="eyebrow">Paid Edge extension access</p>
              <h2>NeedRadar Workflow Lab</h2>
              <p>
                A lightweight workflow lab for turning public comments, search queries, and field notes into clearer
                need clusters before a product is built.
              </p>
              <p className="form-feedback">
                PayPal checkout is required before the install link is shown.
              </p>
            </div>
            <div className="hero-actions product-card-actions">
              <PayPalCheckoutButton productSlug="needradar-workflow-lab" sourcePage="/products#needradar-workflow-lab">
                Pay for NeedRadar access
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
