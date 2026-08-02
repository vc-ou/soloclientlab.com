import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, PostCard, SectionHeading } from "@/components/site";
import { aboutMethodSteps, aboutStudyAreas } from "@/lib/content";
import { getPublicPosts } from "@/lib/db";

export const metadata: Metadata = {
  title: "About SoloClientLab | Research + Product Lab",
  description:
    "Learn how SoloClientLab connects Research, product experiments, and evidence-based workflow validation.",
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
        title="A Research + Product Lab for real workflow signals"
        description={"SoloClientLab.com turns public demand-signal research into focused products, then uses trial and calibration feedback to decide what deserves deeper investment.\nContact me: soloclientlab.com@gmail.com"}
      />

      <section className="container">
        <div className="grid-3">
          <div className="card">
            <h2 style={{ fontSize: "2rem" }}>What SoloClientLab is</h2>
            <p>SoloClientLab.com is an independent Research + Product Lab focused on public demand signals, client workflows, and practical product experiments.</p>
            <p>It publishes research, builds focused tools, and separates genuine use from internal testing or weak attention signals. Contact: soloclientlab.com@gmail.com.</p>
          </div>
          <div className="card">
            <h2 style={{ fontSize: "2rem" }}>What we research</h2>
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
            <h2 style={{ fontSize: "2rem" }}>How the lab works</h2>
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
              <h3>Products stay calibrated</h3>
              <p>Research can suggest a product direction, but trial use, configuration, review, export, and feedback determine what the product becomes.</p>
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
              Research explains the problem and product pages explain the working path. Articles can link naturally to the relevant product or to the next useful research note.
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
