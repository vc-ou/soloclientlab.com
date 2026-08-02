import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, SectionHeading } from "@/components/site";

export const metadata: Metadata = {
  title: "Products | SoloClientLab",
  description: "Focused products built from public demand-signal research and tested in real operator workflows.",
  alternates: {
    canonical: "/products"
  }
};

export default function ProductsPage() {
  return (
    <>
      <PageHero
        align="center"
        className="hero-copy-90"
        eyebrow="Products"
        title="Focused products for demand-signal workflows"
        description="Each product begins with public research, then earns its place through real trial use, configuration, review, export, and feedback."
      />

      <section className="container">
        <div className="section-panel">
          <SectionHeading title="Product index" />
          <div className="product-card">
            <div>
              <p className="eyebrow">Current product · Manufacturing social lead discovery</p>
              <h2>LeadRadar for CNC / Manufacturing</h2>
              <p>
                Find and review sourcing, quotation, sample, MOQ, and capacity signals from social conversations before
                they disappear into manual scanning.
              </p>
              <p className="form-feedback">Microsoft Edge Add-ons listing is under review. Product access requests are open now.</p>
            </div>
            <div className="hero-actions">
              <Link href="/products/leadradar" className="button primary">
                Request LeadRadar access
              </Link>
              <Link href="/tools/leadradar" className="button ghost">
                Open the demo
              </Link>
            </div>
          </div>
          <div className="product-card" style={{ marginTop: 20 }}>
            <div>
              <p className="eyebrow">Workflow lab · Need discovery</p>
              <h2>NeedRadar Workflow Lab</h2>
              <p>
                A lightweight workflow lab for turning public comments, search queries, and field notes into clearer
                need clusters before a product is built.
              </p>
            </div>
            <div className="hero-actions">
              <Link href="/products/needradar-workflow-lab" className="button primary">
                Explore NeedRadar
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
