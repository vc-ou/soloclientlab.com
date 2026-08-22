import Link from "next/link";
import { TrackPostAnalytics } from "@/components/post-analytics";
import { TrackedMarkdown } from "@/components/tracked-markdown";
import { formatDate, labelForTopic } from "@/lib/format";
import type { Post } from "@/lib/types";

export function PostDetail({
  post,
  related,
  trackAnalytics = true
}: {
  post: Post;
  related: Post[];
  trackAnalytics?: boolean;
}) {
  const topicLabel = labelForTopic(post.topic_tag);

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

          <div className="article-content">
            <TrackedMarkdown content={post.content ?? ""} postId={post.id} postSlug={post.slug} />
          </div>

          {post.faq && post.faq.length ? (
            <section className="faq-block" style={{ marginTop: 32 }}>
              <h2>常见问题</h2>
              <div className="faq-list">
                {post.faq.map((item, index) => (
                  <div className="faq-item" key={index} style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 17, marginBottom: 6 }}>{item.question}</h3>
                    <p style={{ margin: 0 }}>{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </article>

        <aside className="sidebar-stack">
          <div className="card">
            <h3>Related research</h3>
            <div className="activity-list">
              {related.map((item) => (
                <div key={item.id}>
                  <Link href={`/research/${item.slug}`} prefetch={false}>
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
