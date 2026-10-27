/**
 * commerce 域 · 只读查询（后台订单页与聚合使用）
 */
import {
  ADMIN_DB_TIMEOUT_MS,
  getReadSql,
  isMissingOptionalTable,
  mapProductEntitlementRow,
  mapProductPaymentRow,
  readLocalDbSafe,
  readWithRetry,
  shouldReadLiveAdminDb,
  shouldReadLiveProducts,
  withTimeout
} from "@/lib/platform";
import type { ProductEntitlementRow, ProductPaymentRow } from "@/lib/platform";
import type { ProductEntitlement, ProductPayment } from "@/lib/types";

export async function getProductPayments(): Promise<ProductPayment[]> {
  if (shouldReadLiveAdminDb()) {
    try {
      const sql = getReadSql();
      const rows = await readWithRetry(
        "Product payments read",
        () => withTimeout(sql<ProductPaymentRow[]>`
          select * from product_payments
          order by created_at desc
        `, ADMIN_DB_TIMEOUT_MS)
      );
      return rows.map(mapProductPaymentRow);
    } catch (error) {
      if (isMissingOptionalTable(error, "product_payments")) return [];
      throw error;
    }
  }

  const db = await readLocalDbSafe();
  return db.product_payments;
}

export async function getProductEntitlements(): Promise<ProductEntitlement[]> {
  if (shouldReadLiveAdminDb()) {
    try {
      const sql = getReadSql();
      const rows = await readWithRetry(
        "Product entitlements read",
        () => withTimeout(sql<ProductEntitlementRow[]>`
          select * from product_entitlements
          order by created_at desc
        `, ADMIN_DB_TIMEOUT_MS)
      );
      return rows.map(mapProductEntitlementRow);
    } catch (error) {
      if (isMissingOptionalTable(error, "product_entitlements")) return [];
      throw error;
    }
  }

  const db = await readLocalDbSafe();
  return db.product_entitlements;
}
