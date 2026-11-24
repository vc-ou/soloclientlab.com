import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, PostCard } from "@/components/site";
import { labelForTopic } from "@/lib/format";
import { getPublicPosts } from "@/lib/domains/content";
import { topicOptions } from "@/lib/content";

type ResearchPageProps = {
  searchParams: Promise<{ topic?: string }>;
};

export const metadata: Metadata = {
  title: "Scene Fix Case Files",
  description:
    "Public case files of scene fixes: where the scene is stuck, what changed first, and what actually happened. Series 01: Listing Autopsy.",
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
        eyebrow="Case Files"
        title="Case files, by scene — not by audience."
        description="Each entry: the stuck step, the one change, where I might be wrong, and the number that would prove it."
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
                  prefetch={false}
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
                    <Link href="/research" className="button primary" prefetch={false}>
                      Browse all topics
                    </Link>
                    <Link href="/products/leadradar" className="button ghost" prefetch={false}>
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
