import type { Metadata } from "next";
import { ProductAccessForm } from "@/components/forms";
import { TrackProductPageView } from "@/components/product-events";
import { PageHero, SectionHeading } from "@/components/site";

export const metadata: Metadata = {
  title: "NeedRadar Workflow Lab",
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
        title="Turn scattered public demand into clearer need clusters"
        description="NeedRadar Workflow Lab is a lightweight product lab for deciding which public signals deserve research, product configuration, or a small workflow test."
        aside={
          <ProductAccessForm
            productSlug="needradar-workflow-lab"
            sourcePage="/products/needradar-workflow-lab"
            title="Request workflow lab access"
            subtitle="Use this when you want help turning comments, search queries, or field notes into a clearer need-discovery workflow."
            defaultAccessType="co_build_access"
          />
        }
      />

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
    </>
  );
}
