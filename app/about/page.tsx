import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, PostCard, SectionHeading } from "@/components/site";
import { aboutMethodSteps, aboutStudyAreas } from "@/lib/content";
import { getPublicPosts } from "@/lib/db";

export const metadata: Metadata = {
  title: "About SoloClientLab Client Acquisition Research",
  description:
    "About SoloClientLab: We turn real-world research into predictable client acquisition strategies and automated AI workflows for solo service businesses and independent practitioners.",
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
            <p>Hi, here is SoloClientLab. As an indie builder and researcher, I specialize in solo service business growth.</p>
            <p>I&apos;ve built and sold online businesses and spent years decoding the client acquisition strategies that actually work. My work helps independent professionals move away from random lead sources to a predictable, data-backed client acquisition system.</p>
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
