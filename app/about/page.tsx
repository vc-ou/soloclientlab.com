import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, PostCard, SectionHeading } from "@/components/site";
import { aboutMethodSteps, aboutStudyAreas } from "@/lib/content";
import { getPublicPosts } from "@/lib/domains/content";

export const metadata: Metadata = {
  title: "About SoloClientLab — Scene Fixes",
  description:
    "A public case file of scene fixes: one real scene, one stuck step, one change, and what actually happened. Series 01: Listing Autopsy.",
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
        className="public-route-hero"
        eyebrow="About SoloClientLab.com"
        title="One real scene at a time."
        description={"SoloClientLab started as a lab for solo client workflows — and evolved into a public case file of scene fixes: finding the exact step where real work gets stuck, testing one minimal fix, and publishing the numbers.\nContact: soloclientlab.com@gmail.com"}
      />

      <section className="container">
        <div className="section-panel route-section">
          <SectionHeading title="Now — updated 5 November 2026" />
          <div className="card">
            <p>
              <strong>Current method: scene fixes.</strong> I start from a real scene, find the single step where it is
              stuck, change one thing, and write down what actually happened — including where my judgment could be
              wrong. Series 01 is Listing Autopsy: real products priced against a 20-item benchmark.
            </p>
            <p>
              <strong>Where it stands:</strong> 20 products sampled in one category, 3 full autopsies completed, 0
              verified sell-through results. Nothing in this series is a proven playbook yet, and it is labelled
              accordingly.
            </p>
            <p style={{ marginBottom: 0 }}>
              <strong>Why it belongs here:</strong> the name started with solo client workflows; the method now looks for
              the exact step where real work gets stuck — whoever is doing that work.
            </p>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="grid-3 about-principles-grid">
          <div className="card">
            <h2 style={{ fontSize: "2rem" }}>What SoloClientLab is</h2>
            <p>SoloClientLab.com is a public case file of scene fixes: one real scene, one stuck step, one change, and what actually happened — with the numbers behind every call.</p>
            <p>Everything published here is labelled for what it is — a judgment, a sample, or a verified result. Contact: soloclientlab.com@gmail.com.</p>
          </div>
          <div className="card">
            <h2 style={{ fontSize: "2rem" }}>Problems we focus on</h2>
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
            <h2 style={{ fontSize: "2rem" }}>How tools earn a place</h2>
            <div className="activity-list">
              {aboutMethodSteps.map((item) => (
                <div key={item.step}>
                  <strong>{item.step}. {item.title}</strong>
                  <p>
                    {item.body}
                    {"activeExperiment" in item && item.activeExperimentHref ? (
                      <>
                        {" "}
                        <Link href={item.activeExperimentHref} prefetch={false}>{item.activeExperiment}</Link>
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
        <div className="section-panel route-section">
          <SectionHeading title="How we keep the work honest" />
          <div className="grid-3">
            <div className="card">
              <h3>Context first</h3>
              <p>Keep the original language and workflow detail together instead of reducing a useful signal to a vague label.</p>
            </div>
            <div className="card">
              <h3>Tests are not promises</h3>
              <p>Internal checks and early previews stay separate from stronger signs such as repeat use, replies, and product feedback.</p>
            </div>
            <div className="card">
              <h3>Products stay focused</h3>
              <p>Paid use, review, export, and feedback decide what stays in the product and what gets left out.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="section-panel route-section about-featured-research-panel">
          <SectionHeading
            title="Featured guides"
            action={
              <Link href="/research" className="button ghost" prefetch={false}>
                Browse all guides
              </Link>
            }
          />
          <div className="about-featured-research-stack">
            <p>
              Practical notes explain a specific problem and point to the next useful action. Start with a guide, then try the workflow if it fits.
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
