import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getResourceBySlug } from "@/lib/db";
import { resourceHighlights } from "@/lib/content";
import { getResourceDeliveryLabel, getResourceDeliveryPath } from "@/lib/resource-delivery";

export const metadata: Metadata = {
  title: "Client Acquisition Report Delivery",
  description: "Access the Client Acquisition Report for Solo Professionals."
};

export default async function ResourceDeliveryPage() {
  const resource = await getResourceBySlug("client-acquisition-report");

  if (!resource) {
    notFound();
  }

  const directAccessHref = getResourceDeliveryPath(resource);
  const isPageDelivery = resource.delivery_mode === "page";

  return (
    <>
      <section className="resource-page-hero">
        <div className="container resource-hero-stack">
          <p className="eyebrow">Report access</p>
          <h1 className="resource-title">Your Client Acquisition Report Is Ready</h1>
          <p className="resource-hero-copy">
            {isPageDelivery
              ? "Use this page as the guided delivery experience after signup, with the key findings ready to scan and the next research paths ready to explore."
              : "Your signup flow is live. Use the button below to open the hosted asset or download the managed file directly."}
          </p>
          {!isPageDelivery && directAccessHref ? (
            <div>
              <Link href={directAccessHref} className="button primary" target="_blank" rel="noreferrer">
                {getResourceDeliveryLabel(resource)}
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="container">
        <div className="section-panel">
          <div className="section-heading">
            <h2>What&apos;s inside the report</h2>
            <Link href="/research" className="button ghost">
              Explore the research
            </Link>
          </div>
          <div className="grid-3">
            {resourceHighlights.map((item) => (
              <article key={item.title} className="card">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container">
        <div className="quote-banner">
          <h3>{isPageDelivery ? "How to use this report well" : "How this delivery flow works"}</h3>
          <p>
            {isPageDelivery
              ? "Start with the repeated pain themes, pick one acquisition angle worth testing, and use the validation checklist before you invest in a new offer or workflow."
              : "This resource is now controlled by the resource delivery settings in admin, so you can swap the underlying file or external destination without changing the signup form."}
          </p>
          <p style={{ marginBottom: 0 }}>
            {isPageDelivery
              ? "When the final PDF is ready, switch the resource to `file` mode and point `delivery_url` to the public asset path."
              : "Keep the landing page stable for conversions, and use delivery mode to decide whether subscribers land on a page, a managed file download, or an external document."}
          </p>
        </div>
      </section>
    </>
  );
}
