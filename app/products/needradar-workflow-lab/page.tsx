import type { Metadata } from "next";
import { PayPalCheckoutButton } from "@/components/paypal-checkout-button";
import { TrackProductPageView } from "@/components/product-events";
import { PageHero, SectionHeading } from "@/components/site";

export const metadata: Metadata = {
  title: {
    absolute: "Demand Research Tool for Public Comments and Search Queries | NeedRadar"
  },
  description:
    "NeedRadar Workflow Lab turns public comments, search queries, and field notes into structured need clusters before a product workflow is built.",
  alternates: {
    canonical: "/products/needradar-workflow-lab"
  }
};

const labSteps = [
  ["Capture", "Collect comments, query fragments, forum questions, and field notes without forcing them into a product idea too early."],
  ["Cluster", "Group repeated pain language by workflow, buyer type, urgency, and current workaround."],
  ["Decide", "Choose whether a pattern should become research, a LeadRadar configuration, a small workflow test, or no action."]
] as const;

export default function NeedRadarWorkflowLabPage() {
  return (
    <>
      <TrackProductPageView productSlug="needradar-workflow-lab" />
      <PageHero
        eyebrow="NeedRadar Workflow Lab"
        title="Turn public comments and search queries into client need clusters"
        description="NeedRadar Workflow Lab is a lightweight product lab for deciding which public signals deserve research, product configuration, or a small workflow test."
        aside={
          <div className="form-card waitlist-card">
            <h3>Pay for NeedRadar access</h3>
            <p className="form-intro">
              PayPal checkout is required before the Microsoft Edge install link is shown.
            </p>
            <PayPalCheckoutButton productSlug="needradar-workflow-lab" sourcePage="/products/needradar-workflow-lab#hero">
              Continue to PayPal checkout
            </PayPalCheckoutButton>
            <p className="form-feedback">
              Payment opens PayPal checkout immediately. Install appears after payment confirmation.
            </p>
          </div>
        }
      />

      <section className="container" id="install">
        <div className="inline-cta">
          <div>
            <p className="eyebrow">Microsoft Edge extension</p>
            <h3>Paid access before Edge install</h3>
            <p>PayPal checkout is required first. The install link appears after payment confirmation.</p>
          </div>
          <PayPalCheckoutButton productSlug="needradar-workflow-lab" sourcePage="/products/needradar-workflow-lab#install">
            Request NeedRadar access
          </PayPalCheckoutButton>
        </div>
      </section>

      <section className="container">
        <div className="section-panel">
          <SectionHeading title="Workflow lab steps" />
          <div className="grid-3">
            {labSteps.map(([title, body], index) => (
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
        <div className="section-panel">
          <SectionHeading title="Install and use NeedRadar" />
          <div className="grid-4">
            {[
              ["Pay with PayPal", "Request access starts secure PayPal checkout immediately."],
              ["Open a source", "Visit a Reddit post or Xiaohongshu note whose visible comments you want to review."],
              ["Review locally", "Open the NeedRadar side panel, select useful excerpts, and organize them into workflow signals."],
              ["Export", "Download your saved research as Markdown or CSV. Captured page content is not sent to SoloClientLab."]
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
            <p className="eyebrow">Access and support</p>
            <h2>Start PayPal access before installing NeedRadar</h2>
            <p>
              Request access now to start PayPal checkout. Payment confirms access and unlocks the install and setup follow-up path.
            </p>
          </div>
          <div className="form-card waitlist-card">
            <h3>Request NeedRadar access</h3>
            <p className="form-intro">
              Click once to enter secure PayPal checkout. Payment confirms access and replaces the old request step.
            </p>
            <PayPalCheckoutButton productSlug="needradar-workflow-lab" sourcePage="/products/needradar-workflow-lab#product-access">
              Request NeedRadar access
            </PayPalCheckoutButton>
            <p className="form-feedback">
              No separate access approval step before checkout.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
