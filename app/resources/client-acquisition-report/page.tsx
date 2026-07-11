import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterForm } from "@/components/forms";
import { getResourceBySlug } from "@/lib/db";
import { resourceCategoryTabs, resourceFeatureCards, resourceHighlights } from "@/lib/content";
import { getResourceLandingPath } from "@/lib/resource-delivery";

export const metadata: Metadata = {
  title: "Client Acquisition Report for Solo Professionals",
  description:
    "Join for research updates, future resources, and practical client acquisition workflows for solo professionals.",
  alternates: {
    canonical: "/resources/client-acquisition-report"
  }
};

type ResourcePageProps = {
  searchParams?: Promise<{
    fromPost?: string;
  }>;
};

export default async function ResourcePage({ searchParams }: ResourcePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const resource = await getResourceBySlug("client-acquisition-report");
  const resourcePageHref = resource ? getResourceLandingPath(resource) : "/resources/client-acquisition-report";
  const fromPost = typeof resolvedSearchParams?.fromPost === "string" ? resolvedSearchParams.fromPost : undefined;
  const sourcePage = fromPost ? `/research/${fromPost}` : resourcePageHref;

  return (
    <>
      <section className="resource-page-hero">
        <div className="container resource-hero-stack">
          <p className="eyebrow">Research updates</p>
          <h1 className="resource-title">Client Acquisition Updates &amp; Insights for Solo Professionals</h1>
          <p className="resource-hero-copy">
            Join the list for new research notes, future resources, and practical workflow experiments for solo professionals.
          </p>
          <div className="resource-tab-row">
            {resourceCategoryTabs.map((item, index) => (
              <span key={item} className={`resource-tab${index === 0 ? " active" : ""}`}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="container">
        <div className="resource-collection">
          {resourceFeatureCards.map((item, index) => (
            <article key={item.title} className={`resource-feature-card${index === 0 ? " resource-feature-card-primary" : ""}`}>
              <div className="resource-feature-cover">
                <div className="resource-cover-inner">
                  <p>{index === 0 ? "SOLOCLIENTLAB.COM" : item.eyebrow.toUpperCase()}</p>
                  <strong>{item.title}</strong>
                  <span>{index === 0 ? "The patterns, problems, and practical next steps." : "Focused, practical, and research-backed."}</span>
                </div>
              </div>
              <div className="resource-feature-body">
                <p className="resource-feature-eyebrow">{item.eyebrow}</p>
                <h2>{item.title}</h2>
                <p>{item.body}</p>
                {index === 0 ? (
                  <div id="resource-form" className="resource-inline-form">
                    <NewsletterForm
                      sourceType="resource"
                      sourcePage={sourcePage}
                      topicTag="client_acquisition"
                      postSlug={fromPost}
                      title="Get updates by email"
                      subtitle="Enter your email to join the list and hear when new research, workflow experiments, and future resources go live."
                      buttonLabel="Join the updates →"
                    />
                  </div>
                ) : (
                  <div className="resource-feature-list">
                    {(index === 1 ? resourceHighlights.slice(0, 3) : resourceHighlights.slice(3, 6)).map((highlight) => (
                      <div key={highlight.title} className="resource-mini-item">
                        <h3>{highlight.title}</h3>
                        <p>{highlight.body}</p>
                      </div>
                    ))}
                  </div>
                )}
                {index === 0 ? null : (
                  <Link href="/newsletter" className="button primary">
                    {item.cta}
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
