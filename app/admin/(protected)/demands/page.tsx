import Link from "next/link";
import { AdminShell, FilterForm, SimpleTable } from "@/components/admin";
import { topicOptions } from "@/lib/content";
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
    <AdminShell title="Demand Database">
      <div className="admin-topbar">
        <p>Manage raw demand signals, scoring, and next actions.</p>
        <Link href="/admin/demands/new" className="button primary">
          New demand
        </Link>
      </div>
      <FilterForm resetHref="/admin/demands">
        <label className="field">
          <span>Search</span>
          <input name="query" defaultValue={filters.query ?? ""} placeholder="Title, keyword, quote..." />
        </label>
        <label className="field">
          <span>Source platform</span>
          <select name="source_platform" defaultValue={filters.source_platform ?? ""}>
            <option value="">All platforms</option>
            {filterOptions.platforms.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Persona</span>
          <select name="persona" defaultValue={filters.persona ?? ""}>
            <option value="">All personas</option>
            {filterOptions.personas.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue={filters.status ?? ""}>
            <option value="">All statuses</option>
            {["raw", "reviewed", "clustered", "used_in_post", "archived"].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Topic tag</span>
          <select name="topic_tag" defaultValue={filters.topic_tag ?? ""}>
            <option value="">All topics</option>
            {topicOptions.filter((option) => option.value !== "all").map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Sort</span>
          <select name="sort" defaultValue={filters.sort ?? "created_desc"}>
            {[
              ["created_desc", "Newest first"],
              ["created_asc", "Oldest first"],
              ["updated_desc", "Recently updated"],
              ["pain_desc", "Highest pain"],
              ["frequency_desc", "Highest frequency"],
              ["payment_desc", "Highest payment"]
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </FilterForm>
      <SimpleTable
        headers={["Title", "Platform", "Persona", "Keyword", "Pain", "Frequency", "Payment", "Evidence", "Status", "Created"]}
        rows={demands.map((demand) => [
          <Link key={demand.id} href={`/admin/demands/${demand.id}`}>
            {demand.title}
          </Link>,
          demand.source_platform ?? "—",
          demand.persona ?? "—",
          demand.keyword ?? "—",
          demand.pain_score ?? "—",
          demand.frequency_score ?? "—",
          demand.payment_score ?? "—",
          demand.evidence_strength ?? "—",
          demand.status,
          demand.created_at.slice(0, 10)
        ])}
      />
    </AdminShell>
  );
}
