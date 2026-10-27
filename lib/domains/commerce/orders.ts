import type {
  ProductEntitlement,
  ProductLicenseActivation,
  ProductLicenseKey,
  ProductPayment
} from "@/lib/types";
import { readDb } from "@/lib/platform";

/**
 * 订单视图：以 payment 为主键，串起 权益 → 授权码 → 激活。
 *
 * 后台以前把这三件事拆在三个页面里，处理一笔订单要来回切。
 * 这里只做读取聚合，不改任何表。
 */

export type OrderFlag =
  | "paid_without_entitlement"
  | "entitlement_without_key"
  | "key_never_activated"
  | "pending_stale"
  | "pending_expired";

export type OrderRow = {
  payment: ProductPayment;
  entitlement?: ProductEntitlement;
  licenseKey?: ProductLicenseKey;
  activations: ProductLicenseActivation[];
  activeActivationCount: number;
  ageHours: number;
  flags: OrderFlag[];
  /** 越小越靠前；0 = 需要立即处理 */
  priority: number;
};

const FLAG_LABEL: Record<OrderFlag, string> = {
  paid_without_entitlement: "已付款但无权益",
  entitlement_without_key: "有权益但未发授权码",
  key_never_activated: "发码 3 天未激活",
  pending_stale: "待付款超 24h",
  pending_expired: "待付款超 72h"
};

const FLAG_PRIORITY: Record<OrderFlag, number> = {
  paid_without_entitlement: 0,
  entitlement_without_key: 1,
  key_never_activated: 2,
  pending_stale: 3,
  pending_expired: 4
};

export function getOrderFlagLabel(flag: OrderFlag) {
  return FLAG_LABEL[flag];
}

function hoursSince(iso?: string) {
  if (!iso) return 0;
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 36_000) / 100);
}

export async function getOrderRows(): Promise<OrderRow[]> {
  const db = await readDb();
  const entitlementsByPayment = new Map<string, ProductEntitlement>();
  for (const entitlement of db.product_entitlements) {
    if (entitlement.source_payment_id) {
      entitlementsByPayment.set(entitlement.source_payment_id, entitlement);
    }
  }

  const keysByEntitlement = new Map<string, ProductLicenseKey>();
  for (const key of db.product_license_keys) {
    keysByEntitlement.set(key.entitlement_id, key);
  }

  const activationsByKey = new Map<string, ProductLicenseActivation[]>();
  for (const activation of db.product_license_activations) {
    const list = activationsByKey.get(activation.license_key_id) ?? [];
    list.push(activation);
    activationsByKey.set(activation.license_key_id, list);
  }

  const rows: OrderRow[] = db.product_payments.map((payment) => {
    const entitlement = entitlementsByPayment.get(payment.id);
    const licenseKey = entitlement ? keysByEntitlement.get(entitlement.id) : undefined;
    const activations = licenseKey ? activationsByKey.get(licenseKey.id) ?? [] : [];
    const activeActivationCount = activations.filter((a) => a.status === "active").length;
    const ageHours = hoursSince(payment.paid_at ?? payment.created_at);

    const flags: OrderFlag[] = [];
    if (payment.status === "paid" && !entitlement) flags.push("paid_without_entitlement");
    if (payment.status === "paid" && entitlement && !licenseKey) flags.push("entitlement_without_key");
    if (licenseKey && activeActivationCount === 0 && hoursSince(licenseKey.created_at) > 72) {
      flags.push("key_never_activated");
    }
    if (payment.status === "pending") {
      if (hoursSince(payment.created_at) > 72) flags.push("pending_expired");
      else if (hoursSince(payment.created_at) > 24) flags.push("pending_stale");
    }

    const priority = flags.length
      ? Math.min(...flags.map((flag) => FLAG_PRIORITY[flag]))
      : payment.status === "paid"
        ? 10
        : 20;

    return { payment, entitlement, licenseKey, activations, activeActivationCount, ageHours, flags, priority };
  });

  return rows.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    // 同优先级：pending 的按"放得越久越靠前"，已付的按时间倒序
    if (a.payment.status === "pending" && b.payment.status === "pending") {
      return a.payment.created_at.localeCompare(b.payment.created_at);
    }
    return b.payment.created_at.localeCompare(a.payment.created_at);
  });
}

export async function getOrderRow(paymentId: string): Promise<OrderRow | null> {
  const rows = await getOrderRows();
  return rows.find((row) => row.payment.id === paymentId) ?? null;
}
