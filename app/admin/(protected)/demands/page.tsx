import Link from "next/link";
import { AdminShell, FilterForm, SimpleTable } from "@/components/admin";
import { personaOptions, topicOptions } from "@/lib/content";
import { formatAdminLabel } from "@/lib/admin-labels";
import { getDemandFilterOptions, getFilteredDemands } from "@/lib/db";

type AdminDemandsPageProps = {
  searchParams: Promise<{
    query?: string;
    source_platform?: string;
    persona?: string;
    status?: string;
    topic_tag?: string;
    sort?: string;
  }>;
};

export default async function AdminDemandsPage({ searchParams }: AdminDemandsPageProps) {
  const filters = await searchParams;
  const [demands, filterOptions] = await Promise.all([
    getFilteredDemands(filters),
    getDemandFilterOptions()
  ]);

  return (
    <AdminShell title="需求库">
      <div className="admin-topbar">
        <p>管理原始需求信号、评分和下一步动作。</p>
        <Link href="/admin/demands/new" className="button primary">
          新建需求
        </Link>
      </div>
      <FilterForm resetHref="/admin/demands">
        <label className="field">
          <span>搜索</span>
          <input name="query" defaultValue={filters.query ?? ""} placeholder="标题、关键词、引用..." />
        </label>
        <label className="field">
          <span>来源平台</span>
          <select name="source_platform" defaultValue={filters.source_platform ?? ""}>
            <option value="">全部平台</option>
            {filterOptions.platforms.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>用户类型</span>
          <select name="persona" defaultValue={filters.persona ?? ""}>
            <option value="">全部用户类型</option>
            {filterOptions.personas.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>状态</span>
          <select name="status" defaultValue={filters.status ?? ""}>
            <option value="">全部状态</option>
            {[
              ["raw", "原始"],
              ["reviewed", "已复核"],
              ["clustered", "已聚类"],
              ["used_in_post", "已用于文章"],
              ["archived", "已归档"]
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>主题标签</span>
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
          <span>排序</span>
          <select name="sort" defaultValue={filters.sort ?? "created_desc"}>
            {[
              ["created_desc", "最新优先"],
              ["created_asc", "最早优先"],
              ["updated_desc", "最近更新"],
              ["pain_desc", "最高痛点"],
              ["frequency_desc", "最高频次"],
              ["payment_desc", "最高支付"]
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </FilterForm>
      <SimpleTable
        headers={["标题", "平台", "用户类型", "关键词", "痛点", "频次", "支付", "证据", "状态", "创建时间"]}
        rows={demands.map((demand) => [
          <Link key={demand.id} href={`/admin/demands/${demand.id}`}>
            {demand.title}
          </Link>,
          demand.source_platform ?? "—",
          personaOptions.find((option) => option.value === demand.persona)?.label ?? "—",
          demand.keyword ?? "—",
          demand.pain_score ?? "—",
          demand.frequency_score ?? "—",
          demand.payment_score ?? "—",
          formatAdminLabel(demand.evidence_strength),
          formatAdminLabel(demand.status),
          demand.created_at.slice(0, 10)
        ])}
      />
    </AdminShell>
  );
}
