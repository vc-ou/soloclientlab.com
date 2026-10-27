import Link from "next/link";
import { AdminShell, SimpleTable } from "@/components/admin";
import { formatAdminLabel } from "@/lib/admin-labels";
import { topicLabels } from "@/lib/content";
import { getResourcePerformance } from "@/lib/domains/content";

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default async function AdminResourcesPage() {
  const resources = await getResourcePerformance();

  return (
    <AdminShell title="辅助页面">
      <div className="admin-topbar">
        <p>公开辅助页面已下线（统一 301 到 /research）。此表保留历史交付配置与订阅归因数据。</p>
        <Link href="/admin/resources/new" className="button primary">
          新建页面配置
        </Link>
      </div>
      <SimpleTable
        headers={["标题", "Slug", "类型", "交付", "主题", "联系人", "转化占比", "状态"]}
        rows={resources.map((resource) => [
          <Link key={resource.id} href={`/admin/resources/${resource.id}`}>
            {resource.title}
          </Link>,
          resource.slug,
          formatAdminLabel(resource.type),
          formatAdminLabel(resource.delivery_mode),
          resource.related_topic ? topicLabels[resource.related_topic] ?? resource.related_topic : "—",
          resource.subscriberCount.toString(),
          formatPercent(resource.conversionRate),
          formatAdminLabel(resource.status)
        ])}
      />
    </AdminShell>
  );
}
