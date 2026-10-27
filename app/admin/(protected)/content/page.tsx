import Link from "next/link";
import { AdminShell, SimpleTable } from "@/components/admin";
import { AdminLinkButton } from "@/components/admin-link-button";
import { getAdminPosts, getResourcePerformance } from "@/lib/domains/content";
import { getDemands } from "@/lib/domains/leads";

type ContentPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

const TABS = [
  { key: "posts", label: "文章" },
  { key: "demands", label: "选题池" },
  { key: "resources", label: "归档（已下线）" }
] as const;

function seoScore(post: { seo_title?: string; seo_description?: string; faq?: unknown[] }) {
  const missing = [
    post.seo_title ? null : "标题",
    post.seo_description ? null : "描述",
    post.faq && post.faq.length ? null : "FAQ"
  ].filter(Boolean);
  return missing.length ? missing.join(" / ") : "齐全";
}

export default async function AdminContentPage({ searchParams }: ContentPageProps) {
  const { tab } = await searchParams;
  const active = (TABS.find((t) => t.key === tab)?.key ?? "posts") as (typeof TABS)[number]["key"];

  const [posts, demands, resources] = await Promise.all([getAdminPosts(), getDemands(), getResourcePerformance()]);

  return (
    <AdminShell title="内容">
      <div className="admin-topbar">
        <p>文章 / 选题池 / 归档统一入口。文章正文与 SEO 字段都在这里维护。</p>
        {active === "posts" ? (
          <AdminLinkButton href="/admin/content/post/new" idleLabel="新建文章" pendingLabel="加载中..." className="button primary" />
        ) : null}
        {active === "demands" ? (
          <AdminLinkButton href="/admin/content/demand/new" idleLabel="新建选题" pendingLabel="加载中..." className="button primary" />
        ) : null}
      </div>

      <div className="cta-cluster" style={{ marginBottom: 18, flexWrap: "wrap", justifyContent: "flex-start" }}>
        {TABS.map((item) => (
          <Link
            key={item.key}
            href={`/admin/content?tab=${item.key}`}
            className={`button ${active === item.key ? "primary" : "ghost"}`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {active === "posts" ? (
        <>
          <p className="metric-hint" style={{ marginBottom: 10 }}>
            共 {posts.length} 篇，其中草稿 {posts.filter((p) => p.status === "draft").length} 篇。
          </p>
          <SimpleTable
            headers={["标题", "状态", "主题", "SEO 缺口", "发布时间", ""]}
            rows={posts.map((post) => [
              post.title,
              post.status,
              post.topic_tag ?? "—",
              seoScore(post),
              post.published_at ? new Date(post.published_at).toISOString().slice(0, 10) : "—",
              <Link key={post.id} href={`/admin/content/post/${post.id}`}>
                编辑
              </Link>
            ])}
          />
        </>
      ) : null}

      {active === "demands" ? (
        <>
          <p className="metric-hint" style={{ marginBottom: 10 }}>
            共 {demands.length} 条需求信号；聚类后的需求是下一篇文章的输入。
          </p>
          <SimpleTable
            headers={["标题", "状态", "来源平台", "用户类型", "关键词", ""]}
            rows={demands.map((demand) => [
              demand.title,
              demand.status,
              demand.source_platform ?? "—",
              demand.persona ?? "—",
              demand.keyword ?? "—",
              <Link key={demand.id} href={`/admin/content/demand/${demand.id}`}>
                编辑
              </Link>
            ])}
          />
        </>
      ) : null}

      {active === "resources" ? (
        <>
          <p className="queue-empty" style={{ marginBottom: 12 }}>
            辅助页面在前台已下线（/resources → /research 301）。这里只保留历史配置与订阅归因。
          </p>
          <SimpleTable
            headers={["标题", "Slug", "状态", "联系人", "转化占比"]}
            rows={resources.map((resource) => [
              resource.title,
              resource.slug,
              resource.status,
              String(resource.subscriberCount),
              `${Math.round(resource.conversionRate * 100)}%`
            ])}
          />
        </>
      ) : null}
    </AdminShell>
  );
}
