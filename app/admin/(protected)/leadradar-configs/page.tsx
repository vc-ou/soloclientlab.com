import Link from "next/link";
import { AdminShell, SimpleTable } from "@/components/admin";
import { formatAdminLabel } from "@/lib/admin-labels";
import { getLeadRadarConfigs } from "@/lib/db";

export default async function AdminLeadRadarConfigsPage() {
  const configs = await getLeadRadarConfigs();

  return (
    <AdminShell title="LeadRadar 配置">
      <div className="admin-topbar">
        <p>查看 LeadRadar 信号规则的共建配置输入。</p>
        <Link href="/products/leadradar" className="button ghost">
          查看 LeadRadar
        </Link>
      </div>
      <SimpleTable
        headers={["创建时间", "邮箱", "公司", "目标市场", "平台", "关键词", "能力", "线索类型", "状态"]}
        rows={configs.map((config) => [
          config.created_at.slice(0, 16).replace("T", " "),
          config.email,
          config.company_name ?? "-",
          config.target_market ?? "-",
          config.platforms ?? "-",
          config.keywords.join(", "),
          config.capabilities ?? "-",
          config.lead_types ?? "-",
          formatAdminLabel(config.status)
        ])}
      />
    </AdminShell>
  );
}
