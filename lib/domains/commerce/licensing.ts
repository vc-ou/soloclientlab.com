/**
 * commerce 域 · 权益与授权码（只存 hash，明文可重算）
 * 从 lib/db.ts 搬移（S2c-2b），逻辑未改。域外只可见 ../index.ts。
 */
import { randomUUID } from "node:crypto";
import { hasDatabaseUrl } from "@/lib/env";
import {
  ADMIN_DB_TIMEOUT_MS,
  ensureProductLicenseTables,
  isMissingOptionalTable,
  mapProductEntitlementRow,
  mapProductLicenseActivationRow,
  mapProductLicenseKeyRow,
  mapProductPaymentRow,
  readLocalDb,
  readLocalDbSafe,
  readWithRetry,
  shouldReadLiveAdminDb,
  withTimeout,
  writeLocalDb,
  getReadSql,
  getWriteSql,
  ProductEntitlementRow,
  ProductLicenseActivationRow,
  ProductLicenseKeyRow,
  ProductPaymentRow
} from "@/lib/platform";
import type {
  Product,
  ProductEntitlement,
  ProductLicenseActivation,
  ProductLicenseKey,
  ProductPayment,
  ProductSlug
} from "@/lib/types";
export type PaidProductLicenseAccess = {
  payment: ProductPayment;
  entitlement: ProductEntitlement;
  licenseKey?: ProductLicenseKey;
};

export async function getPaidProductLicenseAccessByCheckoutSessionId(
  providerCheckoutSessionId: string,
  productSlug: ProductSlug
): Promise<PaidProductLicenseAccess | null> {
  await ensureProductLicenseTables();

  if (hasDatabaseUrl()) {
    const sql = getReadSql();
    const rows = await sql<Array<{
      payment: ProductPaymentRow;
      entitlement: ProductEntitlementRow;
      license_key: ProductLicenseKeyRow | null;
    }>>`
      select
        to_jsonb(p.*) as payment,
        to_jsonb(e.*) as entitlement,
        case when lk.id is null then null else to_jsonb(lk.*) end as license_key
      from product_payments p
      join product_entitlements e on e.source_payment_id = p.id
      left join product_license_keys lk on lk.entitlement_id = e.id
      where p.provider_checkout_session_id = ${providerCheckoutSessionId}
        and p.product_slug = ${productSlug}
        and p.status = 'paid'
        and e.status = 'active'
      order by e.created_at desc
      limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    const entitlement = mapProductEntitlementRow(row.entitlement);
    if (!isEntitlementCurrentlyActive(entitlement)) return null;
    return {
      payment: mapProductPaymentRow(row.payment),
      entitlement,
      licenseKey: row.license_key ? mapProductLicenseKeyRow(row.license_key) : undefined
    };
  }

  const db = await readLocalDbSafe();
  const payment = db.product_payments.find(
    (item) => item.provider_checkout_session_id === providerCheckoutSessionId && item.product_slug === productSlug && item.status === "paid"
  );
  if (!payment) return null;
  const entitlement = db.product_entitlements.find(
    (item) => item.source_payment_id === payment.id && item.product_slug === productSlug && isEntitlementCurrentlyActive(item)
  );
  if (!entitlement) return null;
  return {
    payment,
    entitlement,
    licenseKey: db.product_license_keys.find((item) => item.entitlement_id === entitlement.id && item.status === "active")
  };
}

export async function ensureProductLicenseKey(input: {
  product_slug: ProductSlug;
  entitlement_id: string;
  source_payment_id?: string;
  key_hash: string;
  key_suffix: string;
  max_activations?: number;
}): Promise<ProductLicenseKey> {
  await ensureProductLicenseTables();
  const nowIso = new Date().toISOString();
  const maxActivations = input.max_activations ?? 1;

  if (hasDatabaseUrl()) {
    const writeSql = getWriteSql();
    await writeSql`
      insert into product_license_keys (
        id, product_slug, entitlement_id, source_payment_id, key_hash, key_suffix,
        status, max_activations, created_at, updated_at
      ) values (
        ${randomUUID()}, ${input.product_slug}, ${input.entitlement_id}, ${input.source_payment_id ?? null},
        ${input.key_hash}, ${input.key_suffix}, 'active', ${maxActivations}, ${nowIso}, ${nowIso}
      )
      on conflict (key_hash) do nothing
    `;
    const rows = await writeSql<ProductLicenseKeyRow[]>`
      select * from product_license_keys
      where key_hash = ${input.key_hash}
      limit 1
    `;
    if (!rows[0]) throw new Error("license_key_not_created");
    return mapProductLicenseKeyRow(rows[0]);
  }

  const db = await readLocalDb();
  let licenseKey = db.product_license_keys.find((item) => item.key_hash === input.key_hash);
  if (!licenseKey) {
    licenseKey = {
      id: randomUUID(),
      product_slug: input.product_slug,
      entitlement_id: input.entitlement_id,
      source_payment_id: input.source_payment_id,
      key_hash: input.key_hash,
      key_suffix: input.key_suffix,
      status: "active",
      max_activations: maxActivations,
      created_at: nowIso,
      updated_at: nowIso
    };
    db.product_license_keys.unshift(licenseKey);
    await writeLocalDb(db);
  }
  return licenseKey;
}

export type ProductLicenseActivationResult =
  | { status: "active"; activation: ProductLicenseActivation; licenseKey: ProductLicenseKey; entitlement: ProductEntitlement }
  | { status: "invalid_license" | "inactive" | "activation_limit_reached" };


export async function activateProductLicense(input: {
  product_slug: ProductSlug;
  key_hash: string;
  device_id_hash: string;
  token_hash: string;
  metadata?: Record<string, unknown>;
}): Promise<ProductLicenseActivationResult> {
  await ensureProductLicenseTables();
  const nowIso = new Date().toISOString();
  const metadataJson = JSON.parse(JSON.stringify(input.metadata ?? {}));

  if (hasDatabaseUrl()) {
    const writeSql = getWriteSql();
    const licenseRows = await writeSql<Array<{ license_key: ProductLicenseKeyRow; entitlement: ProductEntitlementRow }>>`
      select to_jsonb(lk.*) as license_key, to_jsonb(e.*) as entitlement
      from product_license_keys lk
      join product_entitlements e on e.id = lk.entitlement_id
      where lk.key_hash = ${input.key_hash}
        and lk.product_slug = ${input.product_slug}
      limit 1
    `;
    const licenseRow = licenseRows[0];
    if (!licenseRow) return { status: "invalid_license" };
    const licenseKey = mapProductLicenseKeyRow(licenseRow.license_key);
    const entitlement = mapProductEntitlementRow(licenseRow.entitlement);
    if (licenseKey.status !== "active" || !isEntitlementCurrentlyActive(entitlement)) return { status: "inactive" };

    const existingDeviceRows = await writeSql<ProductLicenseActivationRow[]>`
      select * from product_license_activations
      where license_key_id = ${licenseKey.id}
        and device_id_hash = ${input.device_id_hash}
        and status = 'active'
      limit 1
    `;
    const existingDeviceActivation = existingDeviceRows[0];
    if (existingDeviceActivation) {
      await writeSql`
        update product_license_activations
        set token_hash = ${input.token_hash},
          last_verified_at = ${nowIso},
          metadata = ${writeSql.json({ ...(existingDeviceActivation.metadata ?? {}), ...metadataJson })},
          updated_at = ${nowIso}
        where id = ${existingDeviceActivation.id}
      `;
      return {
        status: "active",
        activation: {
          ...mapProductLicenseActivationRow(existingDeviceActivation),
          token_hash: input.token_hash,
          last_verified_at: nowIso,
          metadata: { ...(existingDeviceActivation.metadata ?? {}), ...metadataJson },
          updated_at: nowIso
        },
        licenseKey,
        entitlement
      };
    }

    const activeRows = await writeSql<Array<{ count: number }>>`
      select count(*)::int as count
      from product_license_activations
      where license_key_id = ${licenseKey.id}
        and status = 'active'
    `;
    if ((activeRows[0]?.count ?? 0) >= licenseKey.max_activations) {
      return { status: "activation_limit_reached" };
    }

    const activation: ProductLicenseActivation = {
      id: randomUUID(),
      license_key_id: licenseKey.id,
      product_slug: input.product_slug,
      device_id_hash: input.device_id_hash,
      token_hash: input.token_hash,
      status: "active",
      activated_at: nowIso,
      last_verified_at: nowIso,
      metadata: metadataJson,
      created_at: nowIso,
      updated_at: nowIso
    };
    await writeSql`
      insert into product_license_activations (
        id, license_key_id, product_slug, device_id_hash, token_hash, status,
        activated_at, last_verified_at, metadata, created_at, updated_at
      ) values (
        ${activation.id}, ${activation.license_key_id}, ${activation.product_slug}, ${activation.device_id_hash},
        ${activation.token_hash}, ${activation.status}, ${activation.activated_at}, ${nowIso},
        ${writeSql.json(metadataJson)}, ${activation.created_at}, ${activation.updated_at}
      )
    `;
    return { status: "active", activation, licenseKey, entitlement };
  }

  const db = await readLocalDb();
  const licenseKey = db.product_license_keys.find(
    (item) => item.key_hash === input.key_hash && item.product_slug === input.product_slug
  );
  if (!licenseKey) return { status: "invalid_license" };
  const entitlement = db.product_entitlements.find((item) => item.id === licenseKey.entitlement_id);
  if (!entitlement || licenseKey.status !== "active" || !isEntitlementCurrentlyActive(entitlement)) return { status: "inactive" };

  const existingDeviceActivation = db.product_license_activations.find(
    (item) => item.license_key_id === licenseKey.id && item.device_id_hash === input.device_id_hash && item.status === "active"
  );
  if (existingDeviceActivation) {
    existingDeviceActivation.token_hash = input.token_hash;
    existingDeviceActivation.last_verified_at = nowIso;
    existingDeviceActivation.metadata = { ...(existingDeviceActivation.metadata ?? {}), ...metadataJson };
    existingDeviceActivation.updated_at = nowIso;
    await writeLocalDb(db);
    return { status: "active", activation: existingDeviceActivation, licenseKey, entitlement };
  }

  const activeActivationCount = db.product_license_activations.filter(
    (item) => item.license_key_id === licenseKey.id && item.status === "active"
  ).length;
  if (activeActivationCount >= licenseKey.max_activations) {
    return { status: "activation_limit_reached" };
  }

  const activation: ProductLicenseActivation = {
    id: randomUUID(),
    license_key_id: licenseKey.id,
    product_slug: input.product_slug,
    device_id_hash: input.device_id_hash,
    token_hash: input.token_hash,
    status: "active",
    activated_at: nowIso,
    last_verified_at: nowIso,
    metadata: metadataJson,
    created_at: nowIso,
    updated_at: nowIso
  };
  db.product_license_activations.unshift(activation);
  await writeLocalDb(db);
  return { status: "active", activation, licenseKey, entitlement };
}

export type ProductLicenseVerificationResult =
  | { status: "active"; activation: ProductLicenseActivation; licenseKey: ProductLicenseKey; entitlement: ProductEntitlement }
  | { status: "inactive" };


export async function verifyProductLicenseToken(input: {
  product_slug: ProductSlug;
  token_hash: string;
  device_id_hash: string;
}): Promise<ProductLicenseVerificationResult> {
  await ensureProductLicenseTables();
  const nowIso = new Date().toISOString();

  if (hasDatabaseUrl()) {
    const writeSql = getWriteSql();
    const rows = await writeSql<Array<{
      activation: ProductLicenseActivationRow;
      license_key: ProductLicenseKeyRow;
      entitlement: ProductEntitlementRow;
    }>>`
      select to_jsonb(a.*) as activation, to_jsonb(lk.*) as license_key, to_jsonb(e.*) as entitlement
      from product_license_activations a
      join product_license_keys lk on lk.id = a.license_key_id
      join product_entitlements e on e.id = lk.entitlement_id
      where a.token_hash = ${input.token_hash}
        and a.device_id_hash = ${input.device_id_hash}
        and a.product_slug = ${input.product_slug}
      limit 1
    `;
    const row = rows[0];
    if (!row) return { status: "inactive" };
    const activation = mapProductLicenseActivationRow(row.activation);
    const licenseKey = mapProductLicenseKeyRow(row.license_key);
    const entitlement = mapProductEntitlementRow(row.entitlement);
    if (activation.status !== "active" || licenseKey.status !== "active" || !isEntitlementCurrentlyActive(entitlement)) {
      return { status: "inactive" };
    }
    await writeSql`
      update product_license_activations
      set last_verified_at = ${nowIso}, updated_at = ${nowIso}
      where id = ${activation.id}
    `;
    return {
      status: "active",
      activation: { ...activation, last_verified_at: nowIso, updated_at: nowIso },
      licenseKey,
      entitlement
    };
  }

  const db = await readLocalDb();
  const activation = db.product_license_activations.find(
    (item) => item.token_hash === input.token_hash && item.device_id_hash === input.device_id_hash && item.product_slug === input.product_slug
  );
  if (!activation) return { status: "inactive" };
  const licenseKey = db.product_license_keys.find((item) => item.id === activation.license_key_id);
  const entitlement = licenseKey ? db.product_entitlements.find((item) => item.id === licenseKey.entitlement_id) : undefined;
  if (!licenseKey || !entitlement || activation.status !== "active" || licenseKey.status !== "active" || !isEntitlementCurrentlyActive(entitlement)) {
    return { status: "inactive" };
  }
  activation.last_verified_at = nowIso;
  activation.updated_at = nowIso;
  await writeLocalDb(db);
  return { status: "active", activation, licenseKey, entitlement };
}



function isEntitlementCurrentlyActive(entitlement: ProductEntitlement) {
  if (entitlement.status !== "active") return false;
  if (!entitlement.ends_at) return true;
  return new Date(entitlement.ends_at).getTime() > Date.now();
}
