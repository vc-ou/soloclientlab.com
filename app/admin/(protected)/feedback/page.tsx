import Link from "next/link";
import { AdminShell, FilterForm, SimpleTable } from "@/components/admin";
import { formatProductLabel } from "@/lib/admin-labels";
import { getFeedbackSourcePageOptions, getFilteredFeedback } from "@/lib/db";

type AdminFeedbackPageProps = {
  searchParams: Promise<{
    tool_slug?: string;
    is_useful?: string;
    has_attachment?: string;
    source_page?: string;
  }>;
};

export default async function AdminFeedbackPage({ searchParams }: AdminFeedbackPageProps) {
  const filters = await searchParams;
  const [feedback, sourcePageOptions] = await Promise.all([
    getFilteredFeedback(filters),
    getFeedbackSourcePageOptions()
  ]);

  return (
    <AdminShell title="试用与校准反馈">
      <div className="admin-topbar">
        <p>按是否有用、是否有附件或来源页面查看试用和校准反馈。</p>
        <Link href="/products/leadradar" className="button ghost">
          查看商品
        </Link>
      </div>
      <FilterForm resetHref="/admin/feedback">
        <label className="field">
          <span>工具</span>
          <select name="tool_slug" defaultValue={filters.tool_slug ?? ""}>
            <option value="">全部工具</option>
            <option value="leadradar">LeadRadar</option>
          </select>
        </label>
        <label className="field">
          <span>是否有用</span>
          <select name="is_useful" defaultValue={filters.is_useful ?? ""}>
            <option value="">全部反馈</option>
            <option value="yes">有用</option>
            <option value="no">没用</option>
          </select>
        </label>
        <label className="field">
          <span>附件</span>
          <select name="has_attachment" defaultValue={filters.has_attachment ?? ""}>
            <option value="">全部</option>
            <option value="yes">有附件</option>
            <option value="no">无附件</option>
          </select>
        </label>
        <label className="field">
          <span>来源页面</span>
          <select name="source_page" defaultValue={filters.source_page ?? ""}>
            <option value="">全部页面</option>
            {sourcePageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </FilterForm>
      <SimpleTable
        headers={["创建时间", "商品", "是否有用", "校准背景", "附件", "来源页面"]}
        rows={feedback.map((entry) => [
          entry.created_at.slice(0, 16).replace("T", " "),
          formatProductLabel(entry.tool_slug),
          entry.is_useful ? "有用" : "没用",
          entry.problem_context,
          entry.attachment_url ? (
            <a href={entry.attachment_url} target="_blank" rel="noreferrer">
              {entry.attachment_name ?? "打开附件"}
            </a>
          ) : "—",
          entry.source_page ?? "—"
        ])}
      />
    </AdminShell>
  );
}
