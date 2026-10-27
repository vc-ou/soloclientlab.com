import Link from "next/link";
import { AdminShell, MetricCard, SimpleTable } from "@/components/admin";
import { getDashboardMetrics, getPostPerformance, getProductAdminMetrics } from "@/lib/domains/analytics";

const gscUrl = "https://search.google.com/search-console";
const bingUrl = "https://www.bing.com/webmasters";
const umamiUrl = process.env.UMAMI_DASHBOARD_URL ?? "https://cloud.umami.is";

export default async function AdminInsightsPage() {
  const [metrics, posts, product] = await Promise.all([
    getDashboardMetrics(),
    getPostPerformance(),
    getProductAdminMetrics()
  ]);

  return (
    <AdminShell title="数据">
      <div className="admin-topbar">
        <p>站内事件是唯一可信的转化口径；外部流量请到 GSC / Bing / Umami 看。</p>
      </div>

      <div className="admin-grid metrics">
        <MetricCard label="已发布文章" value={metrics.publishedPosts} />
        <MetricCard label="文章访问" value={metrics.researchViews} hint="post_events · view" />
        <MetricCard label="商品页访问" value={metrics.productPageViews} />
        <MetricCard label="试用访问请求" value={metrics.trialAccessClicks} />
        <MetricCard label="校准反馈" value={metrics.feedbackCount} />
      </div>

      <section className="activity-card" style={{ marginTop: 24 }}>
        <h2>文章表现</h2>
        <SimpleTable
          headers={["文章", "状态", "访问", "最后活动"]}
          rows={posts.map((post) => [
            <Link key={post.postId} href={`/admin/content/post/${post.postId}`}>
              {post.title}
            </Link>,
            post.status,
            String(post.views),
            post.lastEventAt ? new Date(post.lastEventAt).toISOString().slice(0, 10) : "—"
          ])}
        />
      </section>

      <section className="activity-card" style={{ marginTop: 24 }}>
        <h2>商品事件</h2>
        <SimpleTable
          headers={["事件", "次数"]}
          rows={[
            ["商品页访问", String(product.productPageVisits)],
            ["试用访问请求", String(product.trialAccessRequested)],
            ["PayPal 结账开始", String(product.paypalAccessStarted)],
            ["安装点击", String(product.installClicked)],
            ["问卷完成", String(product.configCompleted)],
            ["CSV 导出", String(product.csvExported)],
            ["已付款订单", String(product.paidPayments)],
            ["有效权益", String(product.activeEntitlements)]
          ]}
        />
      </section>

      <section className="activity-card" style={{ marginTop: 24 }}>
        <h2>外部数据</h2>
        <p className="metric-hint" style={{ marginBottom: 12 }}>
          后台不重造搜索图表。每周用 scripts/gsc-collect.py 产出快照；以下为直达入口。
        </p>
        <div className="order-links">
          <a className="button ghost" href={gscUrl} target="_blank" rel="noreferrer">
            Google Search Console
          </a>
          <a className="button ghost" href={bingUrl} target="_blank" rel="noreferrer">
            Bing Webmaster
          </a>
          <a className="button ghost" href={umamiUrl} target="_blank" rel="noreferrer">
            Umami
          </a>
        </div>
      </section>
    </AdminShell>
  );
}
