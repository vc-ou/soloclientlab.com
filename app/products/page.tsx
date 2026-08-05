import type { Metadata } from "next";
import Link from "next/link";
import { ProductEventLink } from "@/components/product-events";
import { PageHero, SectionHeading } from "@/components/site";
import {
  getNeedRadarExtensionCtaLabel,
  getNeedRadarExtensionHref,
  getNeedRadarExtensionSupportCopy,
  hasNeedRadarEdgeAddonsListing
} from "@/lib/extension-links";

export const metadata: Metadata = {
  title: "Tools | SoloClientLab",
  description: "Focused tools for finding opportunities, reviewing signals, and making independent work easier to run.",
  alternates: {
    canonical: "/products"
  }
};

export default function ProductsPage() {
  const needRadarHref = getNeedRadarExtensionHref();
  const needRadarCtaLabel = getNeedRadarExtensionCtaLabel();
  const needRadarSupportCopy = getNeedRadarExtensionSupportCopy();
  const hasNeedRadarListing = hasNeedRadarEdgeAddonsListing();

  return (
    <>
      <PageHero
        align="center"
        className="public-route-hero"
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
              <p className="form-feedback">Microsoft Edge Add-ons listing is under review. Product access requests are open now.</p>
            </div>
            <div className="hero-actions product-card-actions">
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
              <p className="eyebrow">Workflow lab · In progress</p>
              <h2>NeedRadar Workflow Lab</h2>
              <p>
                A lightweight workflow lab for turning public comments, search queries, and field notes into clearer
                need clusters before a product is built.
              </p>
              <p className="form-feedback">{needRadarSupportCopy}</p>
            </div>
            <div className="hero-actions product-card-actions">
              <ProductEventLink
                href={needRadarHref}
                eventType={hasNeedRadarListing ? "install_clicked" : "trial_access_requested"}
                className="button primary"
                productSlug="needradar-workflow-lab"
              >
                {needRadarCtaLabel}
              </ProductEventLink>
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
