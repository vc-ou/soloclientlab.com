import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, PostCard, SectionHeading } from "@/components/site";
import { aboutMethodSteps, aboutStudyAreas } from "@/lib/content";
import { getPublicPosts } from "@/lib/db";

export const metadata: Metadata = {
  title: "About SoloClientLab",
  description:
    "Learn how SoloClientLab builds focused tools for independent work.",
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
        title="Focused tools for the repetitive parts of solo work"
        description={"SoloClientLab.com is an independent tool brand for consultants, freelancers, creators, and one-person businesses.\nContact: soloclientlab.com@gmail.com"}
      />

      <section className="container">
        <div className="grid-3 about-principles-grid">
          <div className="card">
            <h2 style={{ fontSize: "2rem" }}>What SoloClientLab is</h2>
            <p>SoloClientLab.com is an independent brand making small tools for the work that gets repeated, forgotten, or scattered across too many places.</p>
            <p>We keep the products focused, explain what they can and cannot do, and make it easy to try the workflow before committing. Contact: soloclientlab.com@gmail.com.</p>
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
              <p>Trial use, review, export, and feedback decide what stays in the product and what gets left out.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="section-panel route-section about-featured-research-panel">
          <SectionHeading
            title="Featured guides"
            action={
              <Link href="/research" className="button ghost">
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
