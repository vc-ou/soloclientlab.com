import Link from "next/link";
import { AdminShell, InsightCard, MetricCard, SimpleTable } from "@/components/admin";
import { getPostPerformance } from "@/lib/db";
import { formatDate } from "@/lib/format";

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default async function AdminPostAnalyticsPage() {
  const performance = await getPostPerformance();
  const publishedPosts = performance.filter((post) => post.status === "published");
  const totalViews = publishedPosts.reduce((sum, post) => sum + post.views, 0);
  const totalClicks = publishedPosts.reduce((sum, post) => sum + post.ctaClicks, 0);
  const totalSubscriptions = publishedPosts.reduce((sum, post) => sum + post.subscriptions, 0);
  const averageCtr = totalViews ? totalClicks / totalViews : 0;
  const averageSubscriberRate = totalViews ? totalSubscriptions / totalViews : 0;

  return (
    <AdminShell title="Post Analytics">
      <div className="admin-grid metrics">
        <MetricCard label="Published posts tracked" value={publishedPosts.length} />
        <MetricCard label="Total post views" value={totalViews} />
        <MetricCard label="CTA clicks" value={totalClicks} />
        <MetricCard label="Post-attributed subscribers" value={totalSubscriptions} />
      </div>

      <div className="admin-grid insights" style={{ marginTop: 24 }}>
        <InsightCard
          title="Average CTA rate"
          value={formatPercent(averageCtr)}
          body="The share of article views that continued into the primary CTA."
        />
        <InsightCard
          title="Average subscriber rate"
          value={formatPercent(averageSubscriberRate)}
          body="The share of article views that resulted in a subscriber attributed back to the post."
        />
        <InsightCard
          title="Coverage"
          value={publishedPosts.some((post) => post.views > 0) ? "Live" : "Waiting"}
          body={publishedPosts.some((post) => post.views > 0)
            ? "Tracking is now recording article reads and CTA activity inside this app."
            : "Publish or visit a tracked article to start collecting data."}
        />
      </div>

      <section className="activity-card" style={{ marginTop: 24 }}>
        <h2>Post performance by article</h2>
        <SimpleTable
          headers={["Post", "Status", "Views", "CTA clicks", "Subscribers", "CTA rate", "Subscriber rate", "Last activity"]}
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
            `${post.ctaClicks} · ${post.ctaType}`,
            post.subscriptions.toString(),
            formatPercent(post.ctaClickRate),
            formatPercent(post.subscriptionRate),
            post.lastEventAt ? formatDate(post.lastEventAt) : "—"
          ])}
        />
      </section>
    </AdminShell>
  );
}
