import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, PostCard, SectionHeading } from "@/components/site";
import { getPublicPosts } from "@/lib/db";
import { homeProofItems, homepageBottlenecks, homepageNextSteps } from "@/lib/content";

const leadRadarProductHref = "/products/leadradar";

export const metadata: Metadata = {
  title: {
    absolute: "Client Acquisition Research and LeadRadar Products | SoloClientLab"
  },
  description:
    "SoloClientLab publishes client acquisition research and builds focused tools for turning public demand signals into reviewable client opportunities.",
  alternates: {
    canonical: "/"
  }
};

export default async function HomePage() {
  const posts = await getPublicPosts();
  const featured = posts.slice(0, 3);

  return (
    <>
      <PageHero
        align="center"
        className="hero-copy-90 hero-home-wide"
        title={
          <span className="hero-title-lockup">
            <span className="hero-title-line">Client acquisition research for solo consultants.</span>
            <span className="hero-title-line hero-title-accent">Lead signal tools for manufacturing teams.</span>
          </span>
        }
        description="SoloClientLab publishes client acquisition research and builds focused tools for turning public demand signals into reviewable client opportunities."
        aside={
          <div className="hero-showcase">
            <div className="hero-actions hero-primary-actions">
              <Link href={leadRadarProductHref} className="button primary">
                Explore LeadRadar
              </Link>
              <Link href="/research" className="button secondary">
                Explore research
              </Link>
            </div>
            <div className="hero-product-rail">
              <div>
                <p className="eyebrow">Current product</p>
                <strong>LeadRadar for CNC / Manufacturing</strong>
                <p>Review sourcing and buying signals from public social conversations before they get buried.</p>
              </div>
              <Link href={leadRadarProductHref} className="inline-report-link">
                View product <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        }
      />

      <section className="container">
        <div className="cta-cluster hero-bottom-bar">
          <div className="stats-strip hero-stats hero-bottom-stats">
            <div>
              <strong>Early-stage</strong>
              <span>Research + product lab</span>
            </div>
            <div>
              <strong>In progress</strong>
              <span>Signal workflows</span>
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
          <SectionHeading title="Where public demand workflows usually break down" />
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
            <Link href={leadRadarProductHref} className="inline-report-link">
              Explore LeadRadar for manufacturing <span aria-hidden="true">→</span>
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
            <h2>Move from Research into a product workflow</h2>
            <p>When a repeated problem deserves a real test, we turn it into a focused product workflow with trial access and calibration feedback.</p>
            <div className="activity-list">
              {homepageNextSteps.map((item) => (
                <div key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
            <Link href={leadRadarProductHref} className="button primary">
              Explore LeadRadar
            </Link>
            <p style={{ marginTop: 12 }}>See how the product supports manufacturing teams before opening the on-site demo or requesting trial access.</p>
          </div>
        </div>
      </section>
    </>
  );
}
