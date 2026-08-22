import Link from "next/link";
import { AdminShell, FilterForm } from "@/components/admin";
import { AdminSubscriberTable } from "@/components/admin-subscriber-table";
import { personaOptions, topicOptions } from "@/lib/content";
import { getFilteredSubscribers, getSubscriberLeadMagnetOptions } from "@/lib/db";

type AdminSubscribersPageProps = {
  searchParams: Promise<{
    source_type?: string;
    lead_magnet?: string;
    persona_tag?: string;
    topic_tag?: string;
    status?: string;
  }>;
};

export default async function AdminSubscribersPage({ searchParams }: AdminSubscribersPageProps) {
  const filters = await searchParams;
  const subscribers = await getFilteredSubscribers(filters);
  const resourceOptions = await getSubscriberLeadMagnetOptions();
  const exportParams = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value)
      .map(([key, value]) => [key, value ?? ""])
  );

  return (
    <AdminShell title="联系人">
      <div className="admin-topbar">
        <p>查看来自旧订阅、资源请求、商品访问和其他来源的联系人记录。</p>
        <Link
          href={exportParams.toString() ? `/admin/subscribers/export?${exportParams.toString()}` : "/admin/subscribers/export"}
          className="button ghost"
        >
          导出 CSV
        </Link>
      </div>
      <FilterForm resetHref="/admin/subscribers">
        <label className="field">
          <span>来源类型</span>
          <select name="source_type" defaultValue={filters.source_type ?? ""}>
            <option value="">全部来源</option>
            {[
              ["home", "首页"],
              ["post", "文章页"],
              ["resource", "资源页"],
              ["newsletter_page", "订阅页"],
              ["waitlist", "候补页"]
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>旧来源</span>
          <select name="lead_magnet" defaultValue={filters.lead_magnet ?? ""}>
            <option value="">全部旧来源</option>
            {resourceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>用户类型</span>
          <select name="persona_tag" defaultValue={filters.persona_tag ?? ""}>
            <option value="">全部用户类型</option>
            {personaOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>主题</span>
          <select name="topic_tag" defaultValue={filters.topic_tag ?? ""}>
            <option value="">全部主题</option>
            {topicOptions.filter((option) => option.value !== "all").map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>状态</span>
          <select name="status" defaultValue={filters.status ?? ""}>
            <option value="">全部状态</option>
            {[
              ["active", "活跃"],
              ["unsubscribed", "已退订"],
              ["bounced", "退信"]
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </FilterForm>
      <AdminSubscriberTable subscribers={subscribers} />
    </AdminShell>
  );
}
