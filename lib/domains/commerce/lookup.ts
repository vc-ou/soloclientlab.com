import { getReadSql, readWithRetry, withTimeout, readDb } from "@/lib/platform";
import { hasDatabaseUrl } from "@/lib/env";
import { buildLicenseKey, getLicenseKeySuffix, hashLicenseSecret, isLicensedProduct, normalizeLicenseKey } from "@/lib/licenses";
import type { ProductSlug } from "@/lib/types";
import { ensureProductLicenseKey } from "./licensing";

const ADMIN_READ_TIMEOUT_MS = 20_000;

/**
 * 客户自助找回授权码。
 *
 * 需要「邮箱 + 一个只有买家才知道的标识」双条件，避免凭邮箱就能拿到别人的码：
 *   - 订单号（PayPal order id / capture id）
 *   - 或授权码后 8 位（客户可能只截图到一部分）
 *
 * 返回状态刻意模糊：找不到时一律 not_found，不区分"邮箱不存在"与"订单号不对"。
 */

export type LicenseLookupResult =
  | { status: "ok"; productSlug: ProductSlug; licenseKey: string; maxActivations: number; activeActivations: number; paidAt?: string }
  | { status: "not_found" }
  | { status: "not_paid" }
  | { status: "revoked" };

type LookupRow = {
  payment_id: string;
  payment_status: string;
  paid_at: string | null;
  payment_email: string | null;
  product_slug: string;
  entitlement_id: string;
  entitlement_status: string;
  entitlement_ends_at: string | null;
  max_activations: number | null;
  active_activations: number | null;
};

function isActive(status: string, endsAt: string | null) {
  if (status !== "active") return false;
  if (!endsAt) return true;
  return new Date(endsAt).getTime() > Date.now();
}

async function queryLookup(email: string, identifier: string): Promise<LookupRow | null> {
  if (!hasDatabaseUrl()) {
    const db = await readDb();
    const suffix = normalizeLicenseKey(identifier).slice(-8);

    // 先按订单标识匹配；匹配不到再按"授权码后 8 位"反查（与 SQL 分支保持一致）
    let payment = db.product_payments.find(
      (p) =>
        (p.email ?? "").toLowerCase() === email &&
        (p.provider_checkout_session_id === identifier || p.provider_payment_intent_id === identifier)
    );

    if (!payment) {
      const matchedKey = db.product_license_keys.find((k) => k.key_suffix === suffix);
      const matchedEntitlement = matchedKey
        ? db.product_entitlements.find((e) => e.id === matchedKey.entitlement_id)
        : undefined;
      if (matchedEntitlement?.source_payment_id) {
        payment = db.product_payments.find(
          (p) => p.id === matchedEntitlement.source_payment_id && (p.email ?? "").toLowerCase() === email
        );
      }
    }

    if (!payment) return null;
    const entitlement = db.product_entitlements.find((e) => e.source_payment_id === payment.id);
    if (!entitlement) return null;
    const key = db.product_license_keys.find((k) => k.entitlement_id === entitlement.id);
    return {
      payment_id: payment.id,
      payment_status: payment.status,
      paid_at: payment.paid_at ?? null,
      payment_email: payment.email ?? null,
      product_slug: payment.product_slug,
      entitlement_id: entitlement.id,
      entitlement_status: entitlement.status,
      entitlement_ends_at: entitlement.ends_at ?? null,
      max_activations: key?.max_activations ?? 1,
      active_activations: db.product_license_activations.filter(
        (a) => key && a.license_key_id === key.id && a.status === "active"
      ).length
    };
  }

  const sql = getReadSql();
  const suffix = normalizeLicenseKey(identifier).slice(-8);
  return readWithRetry("License lookup", async () => {
    const rows = await withTimeout(sql<LookupRow[]>`
      select
        p.id as payment_id,
        p.status as payment_status,
        p.paid_at,
        p.email as payment_email,
        p.product_slug,
        e.id as entitlement_id,
        e.status as entitlement_status,
        e.ends_at as entitlement_ends_at,
        lk.max_activations,
        (select count(*)::int from product_license_activations a
          where a.license_key_id = lk.id and a.status = 'active') as active_activations
      from product_payments p
      join product_entitlements e on e.source_payment_id = p.id
      left join product_license_keys lk on lk.entitlement_id = e.id
      where lower(p.email) = ${email}
        and (
          p.provider_checkout_session_id = ${identifier}
          or p.provider_payment_intent_id = ${identifier}
          or lk.key_suffix = ${suffix}
        )
      order by p.created_at desc
      limit 1
    `, ADMIN_READ_TIMEOUT_MS);
    return rows[0] ?? null;
  });
}

export async function findLicenseAccessForCustomer(input: {
  email: string;
  identifier: string;
}): Promise<LicenseLookupResult> {
  const email = input.email.trim().toLowerCase();
  const identifier = input.identifier.trim();
  if (!email || !identifier) return { status: "not_found" };

  const row = await queryLookup(email, identifier);
  if (!row) return { status: "not_found" };
  if (!isLicensedProduct(row.product_slug)) return { status: "not_found" };
  if (row.payment_status === "refunded" || row.entitlement_status === "revoked") return { status: "revoked" };
  if (row.payment_status !== "paid") return { status: "not_paid" };

  const licenseKey = buildLicenseKey(row.product_slug, row.payment_id, row.entitlement_id);
  // 顺带把码落库（幂等），这样后台也能看到后缀
  await ensureProductLicenseKey({
    product_slug: row.product_slug,
    entitlement_id: row.entitlement_id,
    source_payment_id: row.payment_id,
    key_hash: hashLicenseSecret(licenseKey),
    key_suffix: getLicenseKeySuffix(licenseKey),
    max_activations: row.max_activations ?? 1
  });

  return {
    status: "ok",
    productSlug: row.product_slug,
    licenseKey,
    maxActivations: row.max_activations ?? 1,
    activeActivations: row.active_activations ?? 0,
    paidAt: row.paid_at ?? undefined
  };
}
