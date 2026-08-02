import Link from "next/link";
import { AdminShell, SimpleTable } from "@/components/admin";
import { getLeadRadarConfigs } from "@/lib/db";

export default async function AdminLeadRadarConfigsPage() {
  const configs = await getLeadRadarConfigs();

  return (
    <AdminShell title="LeadRadar Configs">
      <div className="admin-topbar">
        <p>Review co-build configuration input for LeadRadar signal rules.</p>
        <Link href="/products/leadradar" className="button ghost">
          View LeadRadar
        </Link>
      </div>
      <SimpleTable
        headers={["Created", "Email", "Company", "Target market", "Platforms", "Keywords", "Capabilities", "Lead types", "Status"]}
        rows={configs.map((config) => [
          config.created_at.slice(0, 16).replace("T", " "),
          config.email,
          config.company_name ?? "-",
          config.target_market ?? "-",
          config.platforms ?? "-",
          config.keywords.join(", "),
          config.capabilities ?? "-",
          config.lead_types ?? "-",
          config.status
        ])}
      />
    </AdminShell>
  );
}
