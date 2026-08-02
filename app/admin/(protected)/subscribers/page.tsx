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
    <AdminShell title="Contacts">
      <div className="admin-topbar">
        <p>Review contact records from legacy subscriptions, resource requests, product access, and other captured sources.</p>
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
          <span>Legacy secondary source</span>
          <select name="lead_magnet" defaultValue={filters.lead_magnet ?? ""}>
            <option value="">All legacy sources</option>
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
      <AdminSubscriberTable subscribers={subscribers} />
    </AdminShell>
  );
}
