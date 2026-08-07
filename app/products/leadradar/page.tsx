import type { Metadata } from "next";
import { ProductEventLink, TrackProductPageView } from "@/components/product-events";
import { LeadRadarConfigForm, ProductAccessForm } from "@/components/forms";
import { PayPalCheckoutButton } from "@/components/paypal-checkout-button";
import { PageHero, SectionHeading } from "@/components/site";
import { hasLeadRadarEdgeAddonsListing, getLeadRadarPartnerPreviewHref } from "@/lib/extension-links";

export const metadata: Metadata = {
  title: "LeadRadar for CNC: Find Manufacturing Lead Signals",
  description:
    "LeadRadar helps CNC and manufacturing teams review TikTok comments and public social conversations for sourcing, RFQ, MOQ, sample, and custom manufacturing signals.",
  alternates: {
    canonical: "/products/leadradar"
  }
};

const workflowSteps = [
  ["Discover", "Open the TikTok searches, accounts, and comment threads where buyers already ask about sourcing, MOQ, samples, capacity, or shipping."],
  ["Configure", "Set the materials, capabilities, countries, keywords, and lead types that matter to your manufacturing business."],
  ["Review", "Separate likely buying or partnership signals from noise while preserving the source context for a human decision."],
  ["Export", "Move the review list into your sales process, then calibrate the rules from what your team finds useful."]
] as const;

export default function LeadRadarProductPage() {
  const partnerPreviewHref = getLeadRadarPartnerPreviewHref();
  const hasEdgeListing = hasLeadRadarEdgeAddonsListing();

  return (
    <>
      <TrackProductPageView />
      <PageHero
        eyebrow="LeadRadar for CNC / Manufacturing"
        title="Turn social manufacturing conversations into reviewable lead signals"
        description="LeadRadar helps manufacturing teams spot sourcing and buying signals in social comments, configure what matters to their business, and move qualified findings into a practical review workflow."
        aside={
          <div className="form-card waitlist-card">
            <h3>{hasEdgeListing ? "Subscribe to LeadRadar" : "Microsoft Edge Add-ons is under review"}</h3>
            <p className="form-intro">
              {hasEdgeListing
                ? "Make a one-time LeadRadar payment and evaluate the workflow in a real manufacturing signal review process."
                : "LeadRadar has been submitted to Microsoft Edge Add-ons and is waiting for review. Request product access now to start PayPal checkout."}
            </p>
            <PayPalCheckoutButton sourcePage="/products/leadradar#hero">
              Request product access
            </PayPalCheckoutButton>
            <p className="form-feedback">Payment opens PayPal checkout immediately.</p>
            <div className="hero-actions">
              <ProductEventLink href="/tools/leadradar" eventType="demo_open" className="button ghost">
                Try workflow demo
              </ProductEventLink>
              <a href={partnerPreviewHref} className="button ghost">
                Partner preview
              </a>
            </div>
            <p className="form-feedback">Current payment channel: PayPal{hasEdgeListing ? " plus Edge Add-ons" : " while Edge Add-ons is under review"}</p>
          </div>
        }
      />

      <section className="container">
        <div className="grid-3">
          <div className="card">
            <h3>For CNC and manufacturing teams</h3>
            <p>Use the real language buyers use when asking about capabilities, MOQ, samples, pricing, lead time, custom work, and supplier fit.</p>
          </div>
          <div className="card">
            <h3>Human review stays in control</h3>
            <p>LeadRadar flags and organizes possible signals. Your team decides what is relevant, what needs calibration, and what deserves follow-up.</p>
          </div>
          <div className="card">
            <h3>Built for a usable sales handoff</h3>
            <p>Move from social scanning to a reviewable list that can be configured, inspected, exported, and used by the people who handle demand.</p>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="section-panel">
          <SectionHeading title="From social signal to sales review" />
          <div className="grid-4">
            {workflowSteps.map(([title, body], index) => (
              <div key={title} className="card">
                <p className="eyebrow">0{index + 1}</p>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container">
        <div className="inline-cta">
          <div>
            <h3>One PayPal access path, one LeadRadar core</h3>
            <p>
              Public users start from PayPal checkout. After payment, LeadRadar access and setup guidance are handled
              from the confirmed payment. Partner preview remains reserved for offline collaboration and customer-specific
              validation.
            </p>
          </div>
          <PayPalCheckoutButton sourcePage="/products/leadradar#subscription-cta">
            Request product access
          </PayPalCheckoutButton>
        </div>
      </section>

      <section className="container" id="manual-install">
        <div className="section-panel">
          <SectionHeading title={hasEdgeListing ? "Edge install and paid access" : "Edge Add-ons review status"} />
          <div className="grid-4">
            {[
              ["Store status", hasEdgeListing ? "Use the Microsoft Edge Add-ons listing as the default public install path after checkout." : "LeadRadar has been submitted to Microsoft Edge Add-ons and is waiting for certification review."],
              ["Pay with PayPal", "Request access starts secure PayPal checkout immediately."],
              ["Use TikTok", "Open TikTok search, videos, comments, or users pages and let LeadRadar collect visible signals into a local review list."],
              ["Access now", "Payment confirms access and unlocks the setup follow-up path."]
            ].map(([title, body]) => (
              <div key={title} className="card">
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container" id="partner-preview">
        <div className="two-column">
          <div className="resource-showcase">
            <p className="eyebrow">Partner preview</p>
            <h2>Offline cooperation follows the collaboration conversation</h2>
            <p>
              When LeadRadar is shared during direct customer conversations, the evaluation window follows the collaboration progress.
              This path is for private installs, pilot discussions, calibration calls, and customer-specific validation.
            </p>
          </div>
          <ProductAccessForm
            productSlug="leadradar"
            sourcePage="/products/leadradar#partner-preview"
            title="Request partner preview"
            subtitle="Use this for offline cooperation, private evaluation, co-build access, or subscription setup conversations."
            defaultAccessType="partner_preview"
            buttonLabel="Request partner preview"
          />
        </div>
      </section>

      <section className="container" id="product-access">
        <div className="two-column">
          <div className="resource-showcase">
            <p className="eyebrow">Product access</p>
            <h2>{hasEdgeListing ? "Need help installing or evaluating LeadRadar?" : "Start PayPal access while Edge review is pending"}</h2>
            <p>
              {hasEdgeListing
                ? "Use this request if you want setup support, calibration help, co-build access, or a partner evaluation path."
                : "The public Edge Add-ons listing is in review. The primary request path now starts PayPal checkout immediately."}
            </p>
          </div>
          <div className="form-card waitlist-card">
            <h3>{hasEdgeListing ? "Start LeadRadar access" : "Request LeadRadar product access"}</h3>
            <p className="form-intro">
              Click once to enter secure PayPal checkout. Payment confirms access and replaces the old product-access request step.
            </p>
            <PayPalCheckoutButton sourcePage="/products/leadradar#product-access">
              Request LeadRadar access
            </PayPalCheckoutButton>
            <p className="form-feedback">No separate access approval step before checkout.</p>
          </div>
        </div>
      </section>

      <section className="container" id="subscription">
        <div className="two-column">
          <div className="resource-showcase">
            <p className="eyebrow">PayPal access payment</p>
            <h2>Move from a promising signal workflow to a paid customer test</h2>
            <p>
              PayPal is the temporary payment path for a manufacturing or sourcing team that wants to test LeadRadar
              against a real market, capability set, and review process. Access is activated after payment confirmation.
            </p>
          </div>
          <div className="form-card waitlist-card">
            <h3>Pay with PayPal</h3>
            <p className="form-intro">
              Continue to secure PayPal checkout. One payment gives you lifetime access to the product.
            </p>
            <PayPalCheckoutButton sourcePage="/products/leadradar#subscription">
              Continue to PayPal checkout
            </PayPalCheckoutButton>
            <p className="form-feedback">Payment opens PayPal checkout immediately.</p>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="two-column">
          <div className="resource-showcase">
            <p className="eyebrow">Co-build configuration</p>
            <h2>Tell LeadRadar what signal rules matter</h2>
            <p>
              The first configuration pass should include concrete keywords, markets, capabilities, and lead types.
              This keeps paid access setup tied to a real manufacturing workflow instead of a vague product waitlist.
            </p>
          </div>
          <LeadRadarConfigForm sourcePage="/products/leadradar" />
        </div>
      </section>
    </>
  );
}
