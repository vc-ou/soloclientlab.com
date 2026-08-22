import Link from "next/link";
import { AdminShell, FilterForm, SimpleTable } from "@/components/admin";
import { waitlistInterestOptions, waitlistProjects } from "@/lib/content";
import { getFilteredWaitlists, getWaitlistFilterOptions } from "@/lib/db";

type AdminWaitlistsPageProps = {
  searchParams: Promise<{
    project_name?: string;
    page_slug?: string;
    interest_tag?: string;
    source_page?: string;
  }>;
};

export default async function AdminWaitlistsPage({ searchParams }: AdminWaitlistsPageProps) {
  const filters = await searchParams;
  const [waitlists, filterOptions] = await Promise.all([
    getFilteredWaitlists(filters),
    getWaitlistFilterOptions()
  ]);
  const exportParams = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value)
      .map(([key, value]) => [key, value ?? ""])
  );
  const projectLabelMap = Object.fromEntries(Object.values(waitlistProjects).map((project) => [project.slug, project.name]));

  return (
    <AdminShell title="访问线索">
      <div className="admin-topbar">
        <p>按商品、访问页、兴趣或来源页面查看商品访问和试用兴趣记录。</p>
        <Link
          href={exportParams.toString() ? `/admin/waitlists/export?${exportParams.toString()}` : "/admin/waitlists/export"}
          className="button ghost"
        >
          导出 CSV
        </Link>
      </div>
      <FilterForm resetHref="/admin/waitlists">
        <label className="field">
          <span>商品</span>
          <select name="project_name" defaultValue={filters.project_name ?? ""}>
            <option value="">全部商品</option>
            {filterOptions.projects.map((option) => (
              <option key={option} value={option}>
                {projectLabelMap[option] ?? option}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>页面 Slug</span>
          <select name="page_slug" defaultValue={filters.page_slug ?? ""}>
            <option value="">全部 Slug</option>
            {Object.values(waitlistProjects).map((project) => (
              <option key={project.slug} value={project.slug}>
                {project.slug}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>兴趣</span>
          <select name="interest_tag" defaultValue={filters.interest_tag ?? ""}>
            <option value="">全部兴趣</option>
            {waitlistInterestOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>来源页面</span>
          <select name="source_page" defaultValue={filters.source_page ?? ""}>
            <option value="">全部页面</option>
            {filterOptions.sourcePages.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </FilterForm>
      <SimpleTable
        headers={["商品", "访问页", "邮箱", "兴趣", "来源页面", "创建时间"]}
        rows={waitlists.map((entry) => [
          entry.project_name,
          entry.page_slug,
          entry.email,
          waitlistInterestOptions.find((option) => option.value === entry.interest_tag)?.label ?? "—",
          entry.source_page ?? "—",
          entry.created_at.slice(0, 10)
        ])}
      />
    </AdminShell>
  );
}
