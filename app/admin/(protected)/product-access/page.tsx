import Link from "next/link";
import { AdminShell, SimpleTable } from "@/components/admin";
import { getProductAccessRequests } from "@/lib/db";

export default async function AdminProductAccessPage() {
  const requests = await getProductAccessRequests();

  return (
    <AdminShell title="Product Access">
      <div className="admin-topbar">
        <p>Review public trial support, partner preview, co-build access, product access, and paid pilot requests.</p>
        <Link href="/products" className="button ghost">
          View products
        </Link>
      </div>
      <SimpleTable
        headers={["Created", "Product", "Access type", "Email", "Company", "Role", "Use case", "Status"]}
        rows={requests.map((request) => [
          request.created_at.slice(0, 16).replace("T", " "),
          request.product_slug,
          request.access_type,
          request.email,
          request.company_name ?? "-",
          request.role ?? "-",
          request.use_case ?? "-",
          request.status
        ])}
      />
    </AdminShell>
  );
}
