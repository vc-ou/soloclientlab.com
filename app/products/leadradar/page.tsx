import type { Metadata } from "next";
import { ExtensionInstallLink } from "@/components/extension-install-link";
import { ProductEventLink, TrackProductPageView } from "@/components/product-events";
import { LeadRadarConfigForm } from "@/components/forms";
import { PayPalCheckoutButton } from "@/components/paypal-checkout-button";
import { PageHero, SectionHeading } from "@/components/site";
import {
  getLeadRadarExtensionSupportCopy,
  hasLeadRadarEdgeAddonsListing
} from "@/lib/extension-links";

export const metadata: Metadata = {
  title: {
    absolute: "Manufacturing Lead Generation Tool for CNC Teams | LeadRadar"
  },
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
  const hasEdgeListing = hasLeadRadarEdgeAddonsListing();
  const extensionSupportCopy = getLeadRadarExtensionSupportCopy();

  return (
    <>
      <TrackProductPageView />
      <PageHero
        eyebrow="LeadRadar for CNC / Manufacturing"
        title="Find CNC and manufacturing lead signals from public conversations"
        description="LeadRadar helps manufacturing teams spot sourcing and buying signals in social comments, configure what matters to their business, and move qualified findings into a practical review workflow."
        aside={
          <div className="form-card waitlist-card">
            <h3>{hasEdgeListing ? "Install LeadRadar for Microsoft Edge" : "Microsoft Edge Add-ons is under review"}</h3>
            <p className="form-intro">
              {hasEdgeListing
                ? "Install the official Edge extension, then use the product page for paid access, setup support, and workflow calibration."
                : "LeadRadar has been submitted to Microsoft Edge Add-ons and is waiting for review. Request product access now to start PayPal checkout."}
            </p>
            {hasEdgeListing ? (
              <ExtensionInstallLink productSlug="leadradar" sourcePage="/products/leadradar#hero" />
            ) : (
              <PayPalCheckoutButton sourcePage="/products/leadradar#hero">
                Request product access
              </PayPalCheckoutButton>
            )}
            <p className="form-feedback">
              {hasEdgeListing ? "Official Edge install is live. PayPal remains available for paid setup." : "Payment opens PayPal checkout immediately."}
            </p>
            <div className="hero-actions">
              <ProductEventLink href="/tools/leadradar" eventType="demo_open" className="button ghost">
                Try workflow demo
              </ProductEventLink>
              {hasEdgeListing ? (
                <PayPalCheckoutButton sourcePage="/products/leadradar#hero-secondary" buttonClassName="button ghost">
                  Pay for access
                </PayPalCheckoutButton>
              ) : null}
            </div>
            <p className="form-feedback">
              {hasEdgeListing ? extensionSupportCopy : "Current payment channel: PayPal while Edge Add-ons is under review"}
            </p>
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
              Public users can install from Microsoft Edge Add-ons once the listing is live. PayPal remains the access
              and setup path for paid evaluation, support, and customer-specific workflow calibration.
            </p>
          </div>
          {hasEdgeListing ? (
            <ExtensionInstallLink productSlug="leadradar" sourcePage="/products/leadradar#subscription-cta" />
          ) : (
            <PayPalCheckoutButton sourcePage="/products/leadradar#subscription-cta">
              Request product access
            </PayPalCheckoutButton>
          )}
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
              ["Access now", hasEdgeListing ? "Install from Edge first, then use PayPal when you need paid support and calibration." : "Payment confirms access and unlocks the setup follow-up path."]
            ].map(([title, body]) => (
              <div key={title} className="card">
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
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
              {hasEdgeListing
                ? "Install the Edge extension for the public workflow, or use PayPal when you want paid setup and evaluation support."
                : "Click once to enter secure PayPal checkout. Payment confirms access and replaces the old product-access request step."}
            </p>
            {hasEdgeListing ? (
              <div className="hero-actions">
                <ExtensionInstallLink productSlug="leadradar" sourcePage="/products/leadradar#product-access" />
                <PayPalCheckoutButton sourcePage="/products/leadradar#product-access" buttonClassName="button ghost">
                  Pay for setup
                </PayPalCheckoutButton>
              </div>
            ) : (
              <PayPalCheckoutButton sourcePage="/products/leadradar#product-access">
                Request LeadRadar access
              </PayPalCheckoutButton>
            )}
            <p className="form-feedback">{hasEdgeListing ? extensionSupportCopy : "No separate access approval step before checkout."}</p>
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
