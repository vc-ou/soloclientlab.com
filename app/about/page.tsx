import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, PostCard, SectionHeading } from "@/components/site";
import { aboutMethodSteps, aboutStudyAreas } from "@/lib/content";
import { getPublicPosts } from "@/lib/domains/content";

export const metadata: Metadata = {
  title: "About SoloClientLab",
  description:
    "An independent experiment in e-commerce judgment: real product autopsies from Pinduoduo, published with the numbers behind each call — including the ones that turned out wrong.",
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
        title="Why a product doesn't sell — and what to change first"
        description={"An independent experiment in e-commerce judgment. I take real products from Pinduoduo, price them against a 20-item benchmark, and publish the one element that is actually killing the sale.\nContact: soloclientlab.com@gmail.com"}
      />

      <section className="container">
        <div className="section-panel route-section">
          <SectionHeading title="Now — updated 5 November 2026" />
          <div className="card">
            <p>
              <strong>Current experiment: a listing autopsy series.</strong> I take real products from Pinduoduo — the
              most price-competitive e-commerce channel in China — price them against a 20-item benchmark set, and write
              down which single element is actually killing the sale, plus where my own judgment could be wrong.
            </p>
            <p>
              <strong>Where it stands:</strong> 20 products sampled in one category, 3 full autopsies completed, 0
              verified sell-through results. Nothing in this series is a proven playbook yet, and it is labelled
              accordingly.
            </p>
            <p style={{ marginBottom: 0 }}>
              <strong>Why it belongs here:</strong> it is the same question this site has always asked — what makes a
              stranger willing to pay — asked from the seller&apos;s side instead of the consultant&apos;s side.
            </p>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="grid-3 about-principles-grid">
          <div className="card">
            <h2 style={{ fontSize: "2rem" }}>What SoloClientLab is</h2>
            <p>SoloClientLab.com is an independent experiment: one person writing down how he judges whether a product can sell, before and after the sales numbers come in.</p>
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
