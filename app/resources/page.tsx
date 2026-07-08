import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterPanel, PageHero, PostCard, SectionHeading } from "@/components/site";
import { getPublicPosts } from "@/lib/db";

export const metadata: Metadata = {
  title: "Resources & Research Hub",
  description:
    "Explore client acquisition resources, free reports, and research posts built to help solo professionals attract better-fit leads without relying on social media."
};

export default async function ResourcesPage() {
  const posts = await getPublicPosts();
  const latestPosts = posts.slice(0, 6);

  return (
    <>
      <PageHero
        align="center"
        className="hero-copy-90 resources-hero"
        eyebrow="Resources"
        title="Resources, Reports & Research Posts"
        description="Browse free client acquisition templates, B2B lead generation toolkits, and long-form research posts designed to turn search traffic into practical next steps."
      />

      <section className="container">
        <div className="content-with-sidebar">
          <div className="resource-hub-stack">
            <div className="resource-hub-grid">
              <article className="resource-hub-card resource-hub-card-primary">
                <p className="eyebrow">Featured resource</p>
                <h2>Client Acquisition Strategies &amp; Reports for Solo Professionals</h2>
                <p>
                  Start here if you want a practical, higher-conviction overview of what is actually blocking growth for solo service businesses.
                </p>
                <Link href="/resources/client-acquisition-report#resource-form" className="button primary">
                  Open the free report
                </Link>
              </article>

              <article className="resource-hub-card">
                <p className="eyebrow">Research archive</p>
                <h2>Follow the long-tail research trail</h2>
                <p>
                  Every published post is part of the SEO flywheel: search query, insight page, and a path back into your primary offer.
                </p>
                <Link href="/research" className="button ghost">
                  Browse all research posts
                </Link>
              </article>
            </div>
          </div>

          <NewsletterPanel
            sourcePage="/resources"
            title="Weekly Research Dispatch"
            body="Get new client acquisition research, SEO angles, and practical AI workflow notes as they are published."
          />
        </div>
      </section>

      <section className="container">
        <div className="section-panel">
          <SectionHeading
            title="Latest research posts"
            action={
              <Link href="/research" className="button ghost">
                View research library
              </Link>
            }
          />
          {latestPosts.length > 0 ? (
            <div className="post-grid">
              {latestPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="empty-state-card">
              <p className="eyebrow">Research library</p>
              <h2>No research posts are published yet.</h2>
              <p>As new SEO articles go live, they will appear here and become crawlable from the main navigation.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
