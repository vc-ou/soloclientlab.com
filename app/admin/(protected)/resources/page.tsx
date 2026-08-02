import Link from "next/link";
import { AdminShell, SimpleTable } from "@/components/admin";
import { getResourcePerformance } from "@/lib/db";

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default async function AdminResourcesPage() {
  const resources = await getResourcePerformance();

  return (
    <AdminShell title="Secondary Pages">
      <div className="admin-topbar">
        <p>Configure secondary page metadata, delivery settings, and update-path tracking.</p>
        <Link href="/admin/resources/new" className="button primary">
          New page config
        </Link>
      </div>
      <SimpleTable
        headers={["Title", "Slug", "Type", "Delivery", "Topic", "Contacts", "Conversion share", "Status"]}
        rows={resources.map((resource) => [
          <Link key={resource.id} href={`/admin/resources/${resource.id}`}>
            {resource.title}
          </Link>,
          resource.slug,
          resource.type,
          resource.delivery_mode ?? "page",
          resource.related_topic ?? "—",
          resource.subscriberCount.toString(),
          formatPercent(resource.conversionRate),
          resource.status
        ])}
      />
    </AdminShell>
  );
}
