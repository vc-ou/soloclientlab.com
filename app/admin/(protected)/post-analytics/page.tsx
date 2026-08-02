import Link from "next/link";
import { AdminShell, InsightCard, MetricCard, SimpleTable } from "@/components/admin";
import { getPostPerformance } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function AdminPostAnalyticsPage() {
  const performance = await getPostPerformance();
  const publishedPosts = performance.filter((post) => post.status === "published");
  const totalViews = publishedPosts.reduce((sum, post) => sum + post.views, 0);

  return (
    <AdminShell title="Post Analytics">
      <div className="admin-grid metrics">
        <MetricCard label="Published posts tracked" value={publishedPosts.length} />
        <MetricCard label="Total article views" value={totalViews} />
      </div>

      <div className="admin-grid insights" style={{ marginTop: 24 }}>
        <InsightCard
          title="GSC priority"
          value="External"
          body="Judge new articles by indexed pages, impressions, clicks, CTR, query fit, and product-page movement in GSC."
        />
        <InsightCard
          title="Coverage"
          value={publishedPosts.some((post) => post.views > 0) ? "Live" : "Waiting"}
          body={publishedPosts.some((post) => post.views > 0)
            ? "Tracking is recording article reads. Pair this with GSC queries, impressions, CTR, and product-page visits."
            : "Publish or visit a tracked article to start collecting local read data, then compare with GSC."}
        />
      </div>

      <section className="activity-card" style={{ marginTop: 24 }}>
        <h2>Post performance by article</h2>
        <SimpleTable
          headers={["Post", "Status", "Views", "Last activity"]}
          rows={performance.map((post) => [
            <div key={post.postId}>
              <Link href={`/admin/posts/${post.postId}`}>
                <strong>{post.title}</strong>
              </Link>
              <p style={{ margin: "4px 0 0" }}>
                <Link href={`/research/${post.slug}`}>/research/{post.slug}</Link>
              </p>
            </div>,
            post.status,
            post.views.toString(),
            post.lastEventAt ? formatDate(post.lastEventAt) : "—"
          ])}
        />
      </section>
    </AdminShell>
  );
}
