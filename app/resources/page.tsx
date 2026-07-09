import type { Metadata } from "next";
import Link from "next/link";
import { NewsletterPanel, PageHero, PostCard, SectionHeading } from "@/components/site";
import { getPublicPosts } from "@/lib/db";

export const metadata: Metadata = {
  title: "Research Archive & Updates",
  description:
    "Browse research posts, workflow updates, and secondary subscription paths for solo professionals exploring better client acquisition systems."
};

export default async function ResourcesPage() {
  const posts = await getPublicPosts();
  const latestPosts = posts.slice(0, 6);

  return (
    <>
      <PageHero
        align="center"
        className="hero-copy-90 resources-hero"
        eyebrow="Archive"
        title="Research Archive, Updates & Secondary Paths"
        description="A secondary hub for readers who want to browse research, revisit older update pages, or subscribe for the next workflow release."
      />

      <section className="container">
        <div className="content-with-sidebar">
          <div className="resource-hub-stack">
            <div className="resource-hub-grid">
              <article className="resource-hub-card resource-hub-card-primary">
                <p className="eyebrow">Research updates</p>
                <h2>Join the update stream for new research and workflow releases</h2>
                <p>
                  This area is no longer the site's main entry point. Use it when you want to revisit update pages, secondary resources, and deeper research context.
                </p>
                <Link href="/newsletter" className="button primary">
                  Join the updates
                </Link>
              </article>

              <article className="resource-hub-card">
                <p className="eyebrow">Research archive</p>
                <h2>Follow the long-tail research trail</h2>
                <p>
                  Every published post is part of the SEO flywheel: search query, insight page, and a path back into your active workflow or newsletter.
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
            body="Get new research notes, workflow experiments, and practical AI operating ideas as they are published."
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
