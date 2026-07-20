import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { InlineCta } from "@/components/forms";
import { PostCtaLink, TrackPostAnalytics } from "@/components/post-analytics";
import { getLeadRadarExtensionCtaLabel, getLeadRadarExtensionHref, getLeadRadarExtensionSupportCopy } from "@/lib/extension-links";
import { formatDate, labelForTopic } from "@/lib/format";
import { getOptimizedStorageImageUrl } from "@/lib/image-url";
import type { Demand, Post } from "@/lib/types";

export function PostDetail({
  post,
  related,
  relatedDemands,
  trackAnalytics = true
}: {
  post: Post;
  related: Post[];
  relatedDemands: Demand[];
  trackAnalytics?: boolean;
}) {
  const topicLabel = labelForTopic(post.topic_tag);
  const extensionHref = getLeadRadarExtensionHref();
  const extensionCtaLabel = getLeadRadarExtensionCtaLabel();
  const extensionSupportCopy = getLeadRadarExtensionSupportCopy();
  const heroImageUrl = getOptimizedStorageImageUrl(post.cover_image_url, {
    width: 1400,
    quality: 80
  });

  return (
    <section className="container">
      <div className="article-layout">
        <article>
          {trackAnalytics ? <TrackPostAnalytics postId={post.id} postSlug={post.slug} /> : null}
          <div className="article-meta" style={{ marginBottom: 18, marginTop: 12 }}>
            <span className="eyebrow">{topicLabel}</span>
            <span>{formatDate(post.published_at)}</span>
            <span>{post.read_time ?? "6 min read"}</span>
          </div>
          <h1 className="article-title">{post.title}</h1>
          <p className="lede">{post.summary}</p>
          <div
            className={`article-hero-image${heroImageUrl ? " has-image" : ""}`}
            style={heroImageUrl ? { backgroundImage: `url(${heroImageUrl})` } : undefined}
          />

          <div className="article-content">
            <ReactMarkdown components={{ h1: "h2" }}>{post.content ?? ""}</ReactMarkdown>

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
                <li>If this pattern points to a real workflow gap, move into a waitlist or live tool flow instead of collecting more passive advice.</li>
              </ul>
            </section>

            {post.cta_type === "waitlist" ? (
              <InlineCta
                title="Join the workflow waitlist"
                body="Be first to hear when the AI Client Acquisition Workflow launches."
              >
                <PostCtaLink
                  href={`${post.cta_target ?? "/waitlist/client-acquisition-ai-workflow"}?fromPost=${post.slug}`}
                  className="button primary"
                  postId={post.id}
                  postSlug={post.slug}
                  ctaType="waitlist"
                >
                  Join the waitlist
                </PostCtaLink>
              </InlineCta>
            ) : null}
          </div>
        </article>

        <aside className="sidebar-stack">
          <div className="card">
            <h3>Want a live workflow, not just more research?</h3>
            <p>Move from passive reading into a real demand-capture experiment when the workflow matches your use case.</p>
            <Link href={extensionHref} className="button secondary">
              {extensionCtaLabel}
            </Link>
            <p style={{ marginTop: 12, marginBottom: 0 }}>{extensionSupportCopy}</p>
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
