import type { Metadata } from "next";
import { ExtensionInstallLink } from "@/components/extension-install-link";
import { PayPalCheckoutButton } from "@/components/paypal-checkout-button";
import { TrackProductPageView } from "@/components/product-events";
import { PageHero, SectionHeading } from "@/components/site";
import {
  getNeedRadarExtensionSupportCopy,
  hasNeedRadarEdgeAddonsListing
} from "@/lib/extension-links";

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
  const extensionSupportCopy = getNeedRadarExtensionSupportCopy();
  const hasEdgeListing = hasNeedRadarEdgeAddonsListing();

  return (
    <>
      <TrackProductPageView productSlug="needradar-workflow-lab" />
      <PageHero
        eyebrow="NeedRadar Workflow Lab"
        title="Turn public comments and search queries into client need clusters"
        description="NeedRadar Workflow Lab is a lightweight product lab for deciding which public signals deserve research, product configuration, or a small workflow test."
        aside={
          <div className="form-card waitlist-card">
            <h3>{hasEdgeListing ? "Install NeedRadar for Microsoft Edge" : "NeedRadar for Microsoft Edge"}</h3>
            <p className="form-intro">
              {hasEdgeListing
                ? "Add the extension from Microsoft Edge Add-ons, then review visible Reddit or Xiaohongshu workflow signals in the Edge side panel."
                : "The official Edge Add-ons listing is being prepared. Request access now to start PayPal checkout."}
            </p>
            {hasEdgeListing ? (
              <ExtensionInstallLink productSlug="needradar-workflow-lab" sourcePage="/products/needradar-workflow-lab#hero" />
            ) : (
              <PayPalCheckoutButton productSlug="needradar-workflow-lab" sourcePage="/products/needradar-workflow-lab#hero">
                Request NeedRadar access
              </PayPalCheckoutButton>
            )}
            <p className="form-feedback">
              {hasEdgeListing ? extensionSupportCopy : "Payment opens PayPal checkout immediately."}
            </p>
          </div>
        }
      />

      <section className="container" id="install">
        <div className="inline-cta">
          <div>
            <p className="eyebrow">Microsoft Edge extension</p>
            <h3>{hasEdgeListing ? "Install from the official Edge Add-ons listing" : "Public Edge installation is not live yet"}</h3>
            <p>{extensionSupportCopy}</p>
          </div>
          {hasEdgeListing ? (
            <ExtensionInstallLink productSlug="needradar-workflow-lab" sourcePage="/products/needradar-workflow-lab#install" />
          ) : (
            <PayPalCheckoutButton productSlug="needradar-workflow-lab" sourcePage="/products/needradar-workflow-lab#install">
              Request NeedRadar access
            </PayPalCheckoutButton>
          )}
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
            <h2>{hasEdgeListing ? "Need help with your NeedRadar workflow?" : "Get the Edge release link when it is ready"}</h2>
            <p>
              {hasEdgeListing
                ? "The public install is self-serve after PayPal checkout. Use this path for setup support or research workflow design."
                : "Request access now to start PayPal checkout while the public listing is being prepared."}
            </p>
          </div>
          <div className="form-card waitlist-card">
            <h3>{hasEdgeListing ? "Start NeedRadar access" : "Request NeedRadar access"}</h3>
            <p className="form-intro">
              {hasEdgeListing
                ? "Install the Edge extension for the public workflow, or use PayPal when you want setup and research workflow support."
                : "Click once to enter secure PayPal checkout. Payment confirms access and replaces the old request step."}
            </p>
            {hasEdgeListing ? (
              <div className="hero-actions">
                <ExtensionInstallLink productSlug="needradar-workflow-lab" sourcePage="/products/needradar-workflow-lab#product-access" />
                <PayPalCheckoutButton productSlug="needradar-workflow-lab" sourcePage="/products/needradar-workflow-lab#product-access" buttonClassName="button ghost">
                  Pay for setup
                </PayPalCheckoutButton>
              </div>
            ) : (
              <PayPalCheckoutButton productSlug="needradar-workflow-lab" sourcePage="/products/needradar-workflow-lab#product-access">
                Request NeedRadar access
              </PayPalCheckoutButton>
            )}
            <p className="form-feedback">
              {hasEdgeListing ? extensionSupportCopy : "No separate access approval step before checkout."}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
