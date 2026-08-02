import type { Metadata } from "next";
import { ProductEventLink, TrackProductPageView } from "@/components/product-events";
import { LeadRadarConfigForm, ProductAccessForm } from "@/components/forms";
import { PageHero, SectionHeading } from "@/components/site";
import {
  getLeadRadarExtensionCtaLabel,
  getLeadRadarExtensionHref,
  getLeadRadarExtensionSupportCopy,
  hasLeadRadarEdgeAddonsListing,
  getLeadRadarPartnerPreviewHref,
  getLeadRadarPublicTrialChannel
} from "@/lib/extension-links";

export const metadata: Metadata = {
  title: "LeadRadar for CNC / Manufacturing",
  description:
    "LeadRadar helps CNC and manufacturing teams discover, review, and export high-intent sourcing signals from social conversations.",
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
  const extensionHref = getLeadRadarExtensionHref();
  const extensionCtaLabel = getLeadRadarExtensionCtaLabel();
  const extensionSupportCopy = getLeadRadarExtensionSupportCopy();
  const publicTrialChannel = getLeadRadarPublicTrialChannel();
  const partnerPreviewHref = getLeadRadarPartnerPreviewHref();
  const hasEdgeListing = hasLeadRadarEdgeAddonsListing();
  const primaryAccessEvent = hasEdgeListing ? "install_clicked" : "trial_access_requested";

  return (
    <>
      <TrackProductPageView />
      <PageHero
        eyebrow="LeadRadar for CNC / Manufacturing"
        title="Turn social manufacturing conversations into reviewable lead signals"
        description="LeadRadar helps manufacturing teams spot sourcing and buying signals in social comments, configure what matters to their business, and move qualified findings into a practical review workflow."
        aside={
          <div className="form-card waitlist-card">
            <h3>{hasEdgeListing ? "Start with the public trial" : "Microsoft Edge Add-ons is under review"}</h3>
            <p className="form-intro">
              {hasEdgeListing
                ? "Install from Microsoft Edge Add-ons first, then evaluate LeadRadar in a real TikTok workflow. The default self-serve trial is 7 days."
                : "LeadRadar has been submitted to Microsoft Edge Add-ons and is waiting for review. Public installation opens after approval; request product access now if you want release timing, setup support, or partner evaluation."}
            </p>
            <ProductEventLink href={extensionHref} eventType={primaryAccessEvent} className="button primary">
              {extensionCtaLabel}
            </ProductEventLink>
            <p className="form-feedback">{extensionSupportCopy}</p>
            <div className="hero-actions">
              <ProductEventLink href="/tools/leadradar" eventType="demo_open" className="button ghost">
                Try workflow demo
              </ProductEventLink>
              <a href={partnerPreviewHref} className="button ghost">
                Partner preview
              </a>
            </div>
            <p className="form-feedback">Current public channel: {publicTrialChannel}</p>
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
            <h3>Two access paths, one LeadRadar core</h3>
            <p>
              Public users will install through Microsoft Edge Add-ons after approval and start a self-serve 7-day trial.
              Until the listing is live, the public path is product access request first. Partner preview remains reserved for
              offline collaboration, pilot conversations, and evaluation windows that follow the real sales process.
            </p>
          </div>
          <ProductEventLink href={extensionHref} eventType={primaryAccessEvent} className="button primary">
            {extensionCtaLabel}
          </ProductEventLink>
        </div>
      </section>

      <section className="container" id="manual-install">
        <div className="section-panel">
          <SectionHeading title={hasEdgeListing ? "Edge self-serve trial" : "Edge Add-ons review status"} />
          <div className="grid-4">
            {[
              ["Store status", hasEdgeListing ? "Use the Microsoft Edge Add-ons listing as the default public install path." : "LeadRadar has been submitted to Microsoft Edge Add-ons and is waiting for certification review."],
              ["Start trial", hasEdgeListing ? "The public build starts a 7-day trial from first install or first launch, without requiring a Product Access form first." : "The public 7-day trial begins after the Edge listing is approved and the self-serve install path is live."],
              ["Use TikTok", "Open TikTok search, videos, comments, or users pages and let LeadRadar collect visible signals into a local review list."],
              ["Access now", "Request product access if you want release timing, setup support, partner preview, or co-build evaluation before public launch."]
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
            <h2>Offline cooperation should not be forced into a 7-day clock</h2>
            <p>
              When LeadRadar is shared during direct customer conversations, the evaluation window follows the collaboration progress.
              This path is for private installs, pilot discussions, calibration calls, and customer-specific validation.
            </p>
          </div>
          <ProductAccessForm
            productSlug="leadradar"
            sourcePage="/products/leadradar#partner-preview"
            title="Request partner preview"
            subtitle="Use this for offline cooperation, private evaluation, co-build access, or paid pilot conversations. It is not the public 7-day self-serve trial."
            defaultAccessType="partner_preview"
          />
        </div>
      </section>

      <section className="container" id="product-access">
        <div className="two-column">
          <div className="resource-showcase">
            <p className="eyebrow">Product access</p>
            <h2>{hasEdgeListing ? "Need help installing or evaluating LeadRadar?" : "Get notified when the public Edge install is approved"}</h2>
            <p>
              {hasEdgeListing
                ? "Use this request if you want setup support, calibration help, co-build access, or a partner evaluation path beyond the self-serve trial."
                : "The public Edge Add-ons listing is in review. Leave your contact details if you want release timing, setup support, or early evaluation while the listing is pending."}
            </p>
          </div>
          <ProductAccessForm
            productSlug="leadradar"
            sourcePage="/products/leadradar#product-access"
            title={hasEdgeListing ? "Request LeadRadar support" : "Request LeadRadar product access"}
            subtitle={
              hasEdgeListing
                ? "Use this for setup support, co-build access, partner preview, or paid pilot conversations after the public install path is live."
                : "Use this while Microsoft Edge Add-ons is reviewing the listing. We will share release timing, setup notes, or partner preview options when relevant."
            }
            defaultAccessType="product_access"
          />
        </div>
      </section>

      <section className="container">
        <div className="two-column">
          <div className="resource-showcase">
            <p className="eyebrow">Co-build configuration</p>
            <h2>Tell LeadRadar what signal rules matter</h2>
            <p>
              The first configuration pass should include concrete keywords, markets, capabilities, and lead types.
              This keeps trial access tied to a real manufacturing workflow instead of a vague product waitlist.
            </p>
          </div>
          <LeadRadarConfigForm sourcePage="/products/leadradar" />
        </div>
      </section>
    </>
  );
}
