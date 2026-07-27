import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, PostCard, SectionHeading } from "@/components/site";
import { aboutMethodSteps, aboutStudyAreas } from "@/lib/content";
import { getPublicPosts } from "@/lib/db";

export const metadata: Metadata = {
  title: "About SoloClientLab | Research Method and Focus",
  description:
    "Learn how SoloClientLab researches client acquisition problems, validates workflow ideas, and decides what deserves a deeper experiment.",
  alternates: {
    canonical: "/about"
  }
};

export default async function AboutPage() {
  const posts = await getPublicPosts();
  const featured = posts.slice(0, 3);

  return (
    <>
      <PageHero
        align="center"
        className="hero-copy-90"
        eyebrow="About SoloClientLab.com"
        title="We study how solo service businesses get clients"
        description={"SoloClientLab.com turns real-world research into clearer decisions on client acquisition, offer validation, and practical AI workflows.\nContact me: soloclientlab.com@gmail.com"}
      />

      <section className="container">
        <div className="grid-3">
          <div className="card">
            <h2 style={{ fontSize: "2rem" }}>Who runs SoloClientLab.com</h2>
            <p>SoloClientLab.com is run by an independent builder and researcher focused on how solo service businesses find clients, validate offers, and improve the workflows around those jobs.</p>
            <p>It is an early-stage research project, not a consultancy ranking or a promise of business results. Contact: soloclientlab.com@gmail.com.</p>
          </div>
          <div className="card">
            <h2 style={{ fontSize: "2rem" }}>What we study</h2>
            <div className="activity-list">
              {aboutStudyAreas.map((item) => (
                <div key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h2 style={{ fontSize: "2rem" }}>Our research method</h2>
            <div className="activity-list">
              {aboutMethodSteps.map((item) => (
                <div key={item.step}>
                  <strong>{item.step}. {item.title}</strong>
                  <p>
                    {item.body}
                    {"activeExperiment" in item && item.activeExperimentHref ? (
                      <>
                        {" "}
                        <Link href={item.activeExperimentHref}>{item.activeExperiment}</Link>
                      </>
                    ) : null}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="section-panel">
          <SectionHeading title="How we treat evidence" />
          <div className="grid-3">
            <div className="card">
              <h3>Source context first</h3>
              <p>Research notes retain the public conversation, workflow context, and uncertainty behind a pattern instead of treating a single comment as market proof.</p>
            </div>
            <div className="card">
              <h3>Self-tests are not validation</h3>
              <p>Internal page views, test clicks, and operator checks are tracked separately from stronger signals such as external visits, replies, submissions, and repeat use.</p>
            </div>
            <div className="card">
              <h3>Experiments stay labeled</h3>
              <p>Tools such as LeadRadar are described as demos or MVPs until real-world testing supports a broader claim.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="section-panel about-featured-research-panel">
          <SectionHeading
            title="Featured research"
            action={
              <Link href="/research" className="button ghost">
                View all research
              </Link>
            }
          />
          <div className="about-featured-research-stack">
            <p>
              We don’t just study market trends—we build clear, actionable paths to acquisition. If you're facing client acquisition hurdles, our latest research breaks down the exact workflows you need:
            </p>
            <div className="post-grid">
              {featured.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
