import Link from "next/link";
import { AdminShell, SimpleTable } from "@/components/admin";
import { formatAdminLabel, formatProductLabel } from "@/lib/admin-labels";
import { getProductAccessRequests } from "@/lib/db";

export default async function AdminProductAccessPage() {
  const requests = await getProductAccessRequests();

  return (
    <AdminShell title="商品访问">
      <div className="admin-topbar">
        <p>查看公开试用支持、合作预览、共建访问、商品访问和付费试点请求。</p>
        <Link href="/products" className="button ghost">
          查看商品页
        </Link>
      </div>
      <SimpleTable
        headers={["创建时间", "商品", "访问类型", "邮箱", "公司", "角色", "使用场景", "状态"]}
        rows={requests.map((request) => [
          request.created_at.slice(0, 16).replace("T", " "),
          formatProductLabel(request.product_slug),
          formatAdminLabel(request.access_type),
          request.email,
          request.company_name ?? "-",
          request.role ?? "-",
          request.use_case ?? "-",
          formatAdminLabel(request.status)
        ])}
      />
    </AdminShell>
  );
}
