import Link from "next/link";
import { AdminShell, FilterForm, SimpleTable } from "@/components/admin";
import { personaOptions, topicOptions } from "@/lib/content";
import { getFilteredSubscribers, getSnapshot } from "@/lib/db";

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
  const db = await getSnapshot();
  const subscribers = await getFilteredSubscribers(filters);
  const resourceOptions = Array.from(new Set(db.subscribers.map((subscriber) => subscriber.lead_magnet).filter(Boolean)));
  const exportParams = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value)
      .map(([key, value]) => [key, value ?? ""])
  );

  return (
    <AdminShell title="Subscribers">
      <div className="admin-topbar">
        <p>Filter subscribers by source, resource, persona, topic, or status.</p>
        <Link
          href={exportParams.toString() ? `/admin/subscribers/export?${exportParams.toString()}` : "/admin/subscribers/export"}
          className="button ghost"
        >
          Export CSV
        </Link>
      </div>
      <FilterForm resetHref="/admin/subscribers">
        <label className="field">
          <span>Source type</span>
          <select name="source_type" defaultValue={filters.source_type ?? ""}>
            <option value="">All sources</option>
            {["home", "post", "resource", "newsletter_page", "waitlist"].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Lead magnet</span>
          <select name="lead_magnet" defaultValue={filters.lead_magnet ?? ""}>
            <option value="">All resources</option>
            {resourceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Persona</span>
          <select name="persona_tag" defaultValue={filters.persona_tag ?? ""}>
            <option value="">All personas</option>
            {personaOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Topic</span>
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
          <span>Status</span>
          <select name="status" defaultValue={filters.status ?? ""}>
            <option value="">All statuses</option>
            {["active", "unsubscribed", "bounced"].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </FilterForm>
      <SimpleTable
        headers={["Email", "Source type", "Source page", "Lead magnet", "Persona", "Topic", "Status", "Created"]}
        rows={subscribers.map((subscriber) => [
          subscriber.email,
          subscriber.source_type ?? "—",
          subscriber.source_page ?? "—",
          subscriber.lead_magnet ?? "—",
          subscriber.persona_tag ?? "—",
          subscriber.topic_tag ?? "—",
          subscriber.status,
          subscriber.created_at.slice(0, 10)
        ])}
      />
    </AdminShell>
  );
}
