import Link from "next/link";
import { AdminShell, FilterForm, SimpleTable } from "@/components/admin";
import { filterPeople, getPeopleRows } from "@/lib/domains/leads";
import { getOrderRows } from "@/lib/domains/commerce";

type PeoplePageProps = {
  searchParams: Promise<{ q?: string; actionable?: string; source_type?: string }>;
};

export default async function AdminPeoplePage({ searchParams }: PeoplePageProps) {
  const params = await searchParams;
  let people: Awaited<ReturnType<typeof getPeopleRows>> = [];
  let paidByEmail = new Map<string, string>();
  let loadError: string | null = null;

  try {
    const [rows, orders] = await Promise.all([getPeopleRows(), getOrderRows()]);
    people = filterPeople(rows, { q: params.q, actionable: params.actionable, sourceType: params.source_type });
    paidByEmail = new Map(
      orders
        .filter((order) => order.payment.email && order.payment.status === "paid")
        .map((order) => [order.payment.email!.toLowerCase(), order.payment.status])
    );
  } catch (error) {
    loadError = error instanceof Error ? error.message : "未知错误";
  }

  const actionableCount = people.filter((person) => person.suggestedTone !== "muted").length;

  return (
    <AdminShell title="客户">
      <div className="admin-topbar">
        <p>
          以邮箱为主键，聚合订阅 / 等待名单 / 访问申请 / 试用 / 问卷。共 {people.length} 人，其中{" "}
          {actionableCount} 人需要跟进。
        </p>
        <Link href={`/admin/export?type=people`} className="button ghost">
          导出 CSV
        </Link>
      </div>

      <FilterForm resetHref="/admin/people">
        <label className="field">
          <span>搜索</span>
          <input name="q" defaultValue={params.q ?? ""} placeholder="邮箱、来源页、标签…" />
        </label>
        <label className="field">
          <span>只看待跟进</span>
          <select name="actionable" defaultValue={params.actionable ?? ""}>
            <option value="">全部</option>
            <option value="1">只看待跟进</option>
          </select>
        </label>
        <label className="field">
          <span>来源类型</span>
          <select name="source_type" defaultValue={params.source_type ?? ""}>
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
      </FilterForm>

      {loadError ? (
        <p className="queue-empty" style={{ borderLeft: "3px solid #c0392b" }}>
          客户数据读取失败：{loadError}。页面已降级，刷新重试。
        </p>
      ) : null}

      <SimpleTable
        headers={["邮箱", "建议动作", "来源", "标签", "申请/试用/问卷", "已付款", "最近活动", "首次出现", ""]}
        rows={people.map((person) => [
          person.email,
          <span className={`flag ${person.suggestedTone === "warn" ? "is-warn" : "is-muted"}`} key={`${person.email}-action`}>
            {person.suggestedAction}
          </span>,
          `${person.sourceType ?? "—"}${person.sourcePage ? ` · ${person.sourcePage}` : ""}`,
          [...person.personaTags, ...person.topicTags, ...person.interests].slice(0, 3).join(" / ") || "—",
          `${person.accessRequests.length} / ${person.trials.length} / ${person.configs.length}`,
          paidByEmail.has(person.email) ? <span className="flag is-ok" key={`${person.email}-paid`}>paid</span> : "—",
          new Date(person.lastSeenAt).toISOString().slice(0, 10),
          new Date(person.firstSeenAt).toISOString().slice(0, 10),
          <Link key={`${person.email}-detail`} href={`/admin/people/${encodeURIComponent(person.email)}`}>
            详情
          </Link>
        ])}
      />

      {people.length === 0 && !loadError ? <p className="queue-empty">没有匹配的客户。</p> : null}
    </AdminShell>
  );
}
