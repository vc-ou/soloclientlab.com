import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { InlineCta, NewsletterForm } from "@/components/forms";
import { NewsletterPanel } from "@/components/site";
import { getDemandsByIds, getPostBySlug, getRelatedPosts } from "@/lib/db";
import { formatDate, labelForTopic } from "@/lib/format";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug, { preferLocal: true });

  if (!post) {
    return {};
  }

  return {
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.summary
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug, { preferLocal: true });

  if (!post) {
    notFound();
  }

  const related = await getRelatedPosts(post.slug, 3, { preferLocal: true });
  const relatedDemands = await getDemandsByIds(post.related_demand_ids ?? [], { preferLocal: true });
  const topicLabel = labelForTopic(post.topic_tag);

  return (
    <section className="container">
      <div className="article-layout">
        <article>
          <div className="article-meta" style={{ marginBottom: 18, marginTop: 12 }}>
            <span className="eyebrow">{labelForTopic(post.topic_tag)}</span>
            <span>{formatDate(post.published_at)}</span>
            <span>{post.read_time ?? "6 min read"}</span>
          </div>
          <h1 className="article-title">{post.title}</h1>
          <p className="lede">{post.summary}</p>
          <div
            className={`article-hero-image${post.cover_image_url ? " has-image" : ""}`}
            style={post.cover_image_url ? { backgroundImage: `url(${post.cover_image_url})` } : undefined}
          />

          <div className="article-content">
            <ReactMarkdown>{post.content ?? ""}</ReactMarkdown>

            {relatedDemands.length ? (
              <section className="quote-banner">
                <h3>Related demand evidence</h3>
                <ul className="list-clean">
                  {relatedDemands.map((demand) => (
                    <li key={demand.id}>
                      <strong>{demand.title}</strong>
                      {demand.user_quote ? <p>{demand.user_quote}</p> : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="quote-banner">
              <h3>Recommended next steps</h3>
              <ul className="list-clean">
                <li>Use this research to name the one {topicLabel.toLowerCase()} bottleneck that matters most right now.</li>
                <li>Choose one change you can test in the next 7 days instead of collecting more tactics.</li>
                <li>If you need a broader diagnosis, use the free report to compare this issue with the wider pattern set.</li>
              </ul>
            </section>

            {post.cta_type === "newsletter" ? (
              <InlineCta
                title="Get weekly research with clearer next steps"
                body="Join solo professionals who want practical research, validation ideas, and AI workflows they can actually act on."
              >
                <NewsletterForm
                  sourceType="post"
                  sourcePage={`/research/${post.slug}`}
                  topicTag={post.topic_tag}
                  buttonLabel="Subscribe"
                />
              </InlineCta>
            ) : null}

            {post.cta_type === "lead_magnet" ? (
              <InlineCta
                title="Free Client Acquisition Report"
                body="A research-backed report that helps you diagnose the bigger pattern and decide what to test next."
              >
                <Link href="/resources/client-acquisition-report" className="button primary">
                  Get Free Access to the Report →
                </Link>
              </InlineCta>
            ) : null}

            {post.cta_type === "waitlist" ? (
              <InlineCta
                title="Join the workflow waitlist"
                body="Be first to hear when the AI Client Acquisition Workflow launches."
              >
                <Link href={post.cta_target ?? "/waitlist/client-acquisition-ai-workflow"} className="button primary">
                  Join the waitlist
                </Link>
              </InlineCta>
            ) : null}
          </div>
        </article>

        <aside className="sidebar-stack">
          <NewsletterPanel
            title="Turn research into a next move"
            body="Get weekly client acquisition research, clearer validation ideas, and practical AI workflows."
            sourcePage={`/research/${post.slug}`}
          />
          <div className="card">
            <h3>Free Client Acquisition Report</h3>
            <p>A 28-page guide to diagnose acquisition bottlenecks, compare repeated patterns, and choose a smarter next step.</p>
            <Link href="/resources/client-acquisition-report" className="button secondary">
              Get Free Access to the Report →
            </Link>
          </div>
          <div className="card">
            <h3>Related research</h3>
            <div className="activity-list">
              {related.map((item) => (
                <div key={item.id}>
                  <Link href={`/research/${item.slug}`}>
                    <strong>{item.title}</strong>
                  </Link>
                  <p>{formatDate(item.published_at)} · {item.read_time ?? "6 min read"}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
