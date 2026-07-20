import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, PostCard, SectionHeading } from "@/components/site";
import { getPublicPosts } from "@/lib/db";
import { homeProofItems, homepageBottlenecks, homepageNextSteps } from "@/lib/content";
import { getLeadRadarExtensionCtaLabel, getLeadRadarExtensionHref, getLeadRadarExtensionSupportCopy } from "@/lib/extension-links";

const leadRadarDemoHref = "/tools/leadradar";

export const metadata: Metadata = {
  title: {
    absolute: "Solo Consultant Client Acquisition Tools | SoloClientLab.com"
  },
  description:
    "Find high-intent client demand in public threads with research-backed acquisition workflows, lightweight tools, and repeatable systems for solo experts.",
  alternates: {
    canonical: "/"
  }
};

export default async function HomePage() {
  const posts = await getPublicPosts();
  const featured = posts.slice(0, 3);
  const extensionHref = getLeadRadarExtensionHref();
  const extensionCtaLabel = getLeadRadarExtensionCtaLabel();
  const extensionSupportCopy = getLeadRadarExtensionSupportCopy();

  return (
    <>
      <PageHero
        align="center"
        className="hero-copy-90 hero-home-wide"
        title={
          <span className="hero-title-lockup">
            <span className="hero-title-line">Client acquisition for solo consultants</span>
            <span className="hero-title-line hero-title-accent">Spot High-Intent Demand Signals</span>
          </span>
        }
        description="Research-backed client acquisition workflows for solo service businesses. Find, validate, and convert leads from public conversations without relying on noisy social media algorithms."
        aside={
          <div className="hero-showcase">
            <div className="hero-actions hero-primary-actions">
              <Link href={leadRadarDemoHref} className="button primary">
                Try LeadRadar now
              </Link>
              <Link href={extensionHref} className="button secondary">
                {extensionCtaLabel}
              </Link>
            </div>
            <div className="hero-visual hero-device-stage">
              <div id="home-hero-cta-card" className="hero-device-card hero-device-card-flat">
                <p className="eyebrow">SoloClientLab.com</p>
                <strong>Research, tools, and demand workflows</strong>
                <p>Use research and focused tooling to find better signals before they get buried in noisy public threads.</p>
              </div>
              <div className="hero-device-glow" />
            </div>
          </div>
        }
      />

      <section className="container">
        <div className="cta-cluster hero-bottom-bar">
          <div className="stats-strip hero-stats hero-bottom-stats">
            <div>
              <strong>120+</strong>
              <span>Demand signals indexed</span>
            </div>
            <div>
              <strong>Live</strong>
              <span>Research hub</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="feature-row proof-grid">
          {homeProofItems.map((item) => (
            <div key={item.title} className="card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container">
        <div className="section-panel">
          <SectionHeading title="Where solo service businesses usually get stuck" />
          <div className="grid-3">
            {homepageBottlenecks.map((item) => (
              <div key={item.title} className="card">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
          <div className="inline-report-cta">
            <p>Some workflows are best understood in public research. Others need a working tool and a tighter feedback loop.</p>
            <Link href={leadRadarDemoHref} className="inline-report-link">
              Try the LeadRadar demo <span aria-hidden="true">→</span>
            </Link>
            <p>Use the tool first on-site, then decide whether the extension workflow is worth the next step.</p>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="section-panel">
          <SectionHeading
            title="Featured research"
            action={
              <Link href="/research" className="button ghost">
                View all research
              </Link>
            }
          />
          <div className="post-grid">
            {featured.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </section>

      <section className="container">
        <div className="two-column home-conversion-panel">
          <div className="resource-showcase">
            <p className="eyebrow">Live workflow</p>
            <h2>Move from research into a real demand-capture workflow</h2>
            <p>When a repeated problem deserves a real test, we turn it into a lightweight workflow and expose it to early operators in public.</p>
            <div className="activity-list">
              {homepageNextSteps.map((item) => (
                <div key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
            <Link href={leadRadarDemoHref} className="button primary">
              Try LeadRadar now
            </Link>
            <p style={{ marginTop: 12 }}>Start with the on-site demo. Move to extension install or private access only if the workflow feels useful.</p>
          </div>
        </div>
      </section>
    </>
  );
}
