import Link from "next/link";
import { NewsletterForm } from "@/components/forms";
import { PageHero, PostCard, SectionHeading } from "@/components/site";
import { getPublicPosts } from "@/lib/db";
import { homeProofItems, homepageBottlenecks, homepageNextSteps, publicSocialProof } from "@/lib/content";

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
            <span className="hero-title-line">Get clients without relying</span>
            <span className="hero-title-line hero-title-accent">on social media</span>
          </span>
        }
        description="Download our Client Acquisition Report to discover data-backed strategies extracted from 320+ solo professional conversations. No fluff, just practical validation workflows."
        aside={
          <div className="hero-showcase">
            <div className="hero-actions hero-primary-actions">
              <Link href="/resources/client-acquisition-report" className="button primary">
                Get Free Access to the Report →
              </Link>
              <Link href="/research" className="button secondary">
                Explore the research
              </Link>
            </div>
            <div className="hero-visual hero-device-stage">
              <div id="home-hero-cta-card" className="hero-device-card hero-device-card-flat">
                <p className="eyebrow">SoloClientLab.com</p>
                <strong>Client Acquisition Report</strong>
                <p>Research-backed insights on how solo service businesses get clients without relying on social media.</p>
              </div>
              <div className="hero-device-glow" />
            </div>
          </div>
        }
      />

      <section className="container">
        <div className="cta-cluster hero-bottom-bar">
          <div className="mini-proof">
            <span className="proof-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M8 10V8a4 4 0 1 1 8 0v2" />
                <rect x="6" y="10" width="12" height="10" rx="2" />
                <path d="M12 14v2.5" />
              </svg>
            </span>
            <span>{publicSocialProof.newsletterJoinCopy}</span>
          </div>
          <div className="stats-strip hero-stats hero-bottom-stats">
            <div>
              <strong>120+</strong>
              <span>Demand signals indexed</span>
            </div>
            <div>
              <strong>Weekly</strong>
              <span>Research updates</span>
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
            <p>We analyzed 320+ solo professional growth bottlenecks to decode alternative acquisition pathways.</p>
            <Link href="/resources/client-acquisition-report" className="inline-report-link">
              See how to fix these gaps in our Free Acquisition Report <span aria-hidden="true">→</span>
            </Link>
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
            <p className="eyebrow">Free report</p>
            <h2>Client Acquisition Strategies &amp; Reports for Solo Professionals</h2>
            <p>A 28-page report to help you diagnose what is slowing growth, see what patterns matter, and decide what to test next.</p>
            <div className="activity-list">
              {homepageNextSteps.map((item) => (
                <div key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
            <Link href="/resources/client-acquisition-report" className="button primary">
              Get Free Access to the Report →
            </Link>
          </div>
          <NewsletterForm
            sourceType="home"
            sourcePage="/"
            topicTag="client_acquisition"
            title="Weekly Client Acquisition Research"
            subtitle="Weekly client acquisition research, validation ideas, and practical AI workflows."
            buttonLabel="Subscribe"
          />
        </div>
      </section>
    </>
  );
}
