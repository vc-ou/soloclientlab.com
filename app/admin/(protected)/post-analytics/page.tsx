import Link from "next/link";
import { AdminShell, MetricCard, SimpleTable } from "@/components/admin";
import { formatAdminLabel } from "@/lib/admin-labels";
import { getPostPerformance } from "@/lib/db";
import { formatDate } from "@/lib/format";

export default async function AdminPostAnalyticsPage() {
  const performance = await getPostPerformance();
  const publishedPosts = performance.filter((post) => post.status === "published");
  const totalViews = publishedPosts.reduce((sum, post) => sum + post.views, 0);

  return (
    <AdminShell title="文章分析">
      <div className="admin-grid metrics">
        <MetricCard label="已跟踪发布文章" value={publishedPosts.length} />
        <MetricCard label="文章总访问" value={totalViews} />
      </div>

      <section className="activity-card" style={{ marginTop: 24 }}>
        <h2>按文章查看表现</h2>
        <SimpleTable
          headers={["文章", "状态", "访问", "最后活动"]}
          rows={performance.map((post) => [
            <div key={post.postId}>
              <Link href={`/admin/posts/${post.postId}`}>
                <strong>{post.title}</strong>
              </Link>
              <p style={{ margin: "4px 0 0" }}>
                <Link href={`/research/${post.slug}`}>/research/{post.slug}</Link>
              </p>
            </div>,
            formatAdminLabel(post.status),
            post.views.toString(),
            post.lastEventAt ? formatDate(post.lastEventAt) : "—"
          ])}
        />
      </section>
    </AdminShell>
  );
}
