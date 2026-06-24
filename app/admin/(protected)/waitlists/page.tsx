import Link from "next/link";
import { AdminShell, FilterForm, SimpleTable } from "@/components/admin";
import { waitlistInterestOptions, waitlistProjects } from "@/lib/content";
import { getFilteredWaitlists, getSnapshot } from "@/lib/db";

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
  const db = await getSnapshot();
  const waitlists = await getFilteredWaitlists(filters);
  const projectOptions = Array.from(new Set(db.waitlists.map((entry) => entry.project_name)));
  const sourcePageOptions = Array.from(new Set(db.waitlists.map((entry) => entry.source_page).filter(Boolean)));
  const exportParams = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value)
      .map(([key, value]) => [key, value ?? ""])
  );

  return (
    <AdminShell title="Waitlists">
      <div className="admin-topbar">
        <p>Filter waitlist signups by project, slug, interest, or source page.</p>
        <Link
          href={exportParams.toString() ? `/admin/waitlists/export?${exportParams.toString()}` : "/admin/waitlists/export"}
          className="button ghost"
        >
          Export CSV
        </Link>
      </div>
      <FilterForm resetHref="/admin/waitlists">
        <label className="field">
          <span>Project</span>
          <select name="project_name" defaultValue={filters.project_name ?? ""}>
            <option value="">All projects</option>
            {projectOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Page slug</span>
          <select name="page_slug" defaultValue={filters.page_slug ?? ""}>
            <option value="">All slugs</option>
            {Object.values(waitlistProjects).map((project) => (
              <option key={project.slug} value={project.slug}>
                {project.slug}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Interest</span>
          <select name="interest_tag" defaultValue={filters.interest_tag ?? ""}>
            <option value="">All interests</option>
            {waitlistInterestOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Source page</span>
          <select name="source_page" defaultValue={filters.source_page ?? ""}>
            <option value="">All pages</option>
            {sourcePageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </FilterForm>
      <SimpleTable
        headers={["Project", "Page slug", "Email", "Interest", "Source page", "Created"]}
        rows={waitlists.map((entry) => [
          entry.project_name,
          entry.page_slug,
          entry.email,
          entry.interest_tag ?? "—",
          entry.source_page ?? "—",
          entry.created_at.slice(0, 10)
        ])}
      />
    </AdminShell>
  );
}
