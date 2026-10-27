import { requireAdmin } from "@/lib/domains/identity";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return children;
}
