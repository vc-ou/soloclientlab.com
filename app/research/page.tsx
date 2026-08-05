import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, PostCard } from "@/components/site";
import { labelForTopic } from "@/lib/format";
import { getPublicPosts } from "@/lib/db";
import { topicOptions } from "@/lib/content";

type ResearchPageProps = {
  searchParams: Promise<{ topic?: string }>;
};

export const metadata: Metadata = {
  title: "Practical Guides for Independent Work",
  description: "Short, practical guides for finding opportunities, organizing client work, and reducing repetitive tasks.",
  alternates: {
    canonical: "/research"
  }
};

export default async function ResearchPage({ searchParams }: ResearchPageProps) {
  const { topic } = await searchParams;
  const posts = await getPublicPosts(topic);
  const activeTopic = topic && topic !== "all" ? topic : "all";
  const selectedTopicLabel = activeTopic !== "all" ? labelForTopic(activeTopic) : "this topic";

  return (
    <>
      <PageHero
        align="center"
        className="public-route-hero"
        eyebrow="Guides"
        title="Practical guides for independent work"
        description="Short explanations for finding opportunities, organizing client work, and deciding what to automate next."
      />

      <section className="container">
        <div className="content-with-sidebar">
          <div>
            <div className="cta-cluster" style={{ marginBottom: 24, flexWrap: "wrap", justifyContent: "flex-start" }}>
              {topicOptions.map((option) => (
                <Link
                  key={option.value}
                  href={option.value === "all" ? "/research" : `/research?topic=${option.value}`}
                  className={`button ${topic === option.value || (!topic && option.value === "all") ? "primary" : "ghost"}`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
            <div key={activeTopic} className="admin-grid">
              {posts.length > 0 ? (
                posts.map((post) => <PostCard key={post.id} post={post} horizontal />)
              ) : (
                <div className="empty-state-card">
                  <p className="eyebrow">Nothing here yet</p>
                  <h2>No guide has been published for {selectedTopicLabel} yet.</h2>
                  <p>
                    We&apos;re still building out this section. In the meantime, browse the available topics or try the live workflow preview.
                  </p>
                  <div className="empty-state-actions">
                    <Link href="/research" className="button primary">
                      Browse all topics
                    </Link>
                    <Link href="/products/leadradar" className="button ghost">
                      Explore LeadRadar
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
