import type { Metadata } from "next";
import Link from "next/link";
import { LeadRadarDemo } from "@/components/leadradar-demo";
import { ProductEventLink } from "@/components/product-events";
import { PageHero } from "@/components/site";

export const metadata: Metadata = {
  title: "LeadRadar Workflow Demo",
  description:
    "Try the illustrative LeadRadar workflow demo, then visit the official LeadRadar product page for CNC and manufacturing teams.",
  alternates: {
    canonical: "/tools/leadradar"
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function LeadRadarDemoPage() {
  return (
    <>
      <PageHero
        align="center"
        className="hero-copy-90"
        eyebrow="Workflow demo"
        title="Try the LeadRadar workflow before PayPal checkout"
        description="This is an illustrative bridge page. The formal product is LeadRadar for CNC and manufacturing teams; this demo shows how visible social comments can move into a review workflow."
        aside={
          <div className="hero-actions">
            <Link href="/products/leadradar" className="button primary">
              View LeadRadar product
            </Link>
            <ProductEventLink href="#leadradar-demo" eventType="demo_open" className="button ghost">
              Open demo workspace
            </ProductEventLink>
          </div>
        }
      />
      <LeadRadarDemo />
    </>
  );
}
