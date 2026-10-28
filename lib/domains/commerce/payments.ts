/**
 * commerce 域 · 支付单与履约（写路径，幂等键在数据库约束上）
 * 从 lib/db.ts 搬移（S2c-2b），逻辑未改。域外只可见 ../index.ts。
 */
import { addDaysIso } from "@/lib/platform";
import { randomUUID } from "node:crypto";
import { hasDatabaseUrl } from "@/lib/env";
import {
  ensureProductLicenseTables,
  ensureProductPaymentsEmailNullable,
  mapProductPaymentRow,
  readLocalDb,
  readLocalDbSafe,
  shouldMirrorDatabaseToLocalFile,
  writeLocalDb,
  getReadSql,
  getWriteSql,
  ProductEntitlementRow,
  ProductPaymentRow
} from "@/lib/platform";
import type {
  ProductAccessType,
  ProductPayment
} from "@/lib/types";
export async function addPendingProductPayment(
  input: Omit<ProductPayment, "id" | "status" | "provider" | "created_at" | "updated_at"> & {
    provider?: ProductPayment["provider"];
  }
) {
  const nowIso = new Date().toISOString();
  const paymentId = randomUUID();
  const email = input.email?.toLowerCase();
  const provider = input.provider ?? "paypal";
  const metadataJson = JSON.parse(JSON.stringify(input.metadata ?? {}));

  if (hasDatabaseUrl()) {
    await ensureProductPaymentsEmailNullable();
    const writeSql = getWriteSql();
    await writeSql`
      insert into product_payments (
        id, product_slug, provider, status, access_request_id, email, currency,
        amount_subtotal, amount_total, provider_checkout_session_id,
        provider_payment_intent_id, provider_customer_id, provider_subscription_id,
        checkout_url, paid_at, refunded_at, metadata, created_at, updated_at
      ) values (
        ${paymentId}, ${input.product_slug}, ${provider}, 'pending',
        ${input.access_request_id ?? null}, ${email ?? null}, ${input.currency ?? null},
        ${input.amount_subtotal ?? null}, ${input.amount_total ?? null},
        ${input.provider_checkout_session_id ?? null}, ${input.provider_payment_intent_id ?? null},
        ${input.provider_customer_id ?? null}, ${input.provider_subscription_id ?? null},
        ${input.checkout_url ?? null}, ${input.paid_at ?? null}, ${input.refunded_at ?? null},
        ${writeSql.json(metadataJson)}, ${nowIso}, ${nowIso}
      )
    `;

    if (shouldMirrorDatabaseToLocalFile()) {
      const localDb = await readLocalDb();
      localDb.product_payments.unshift({
        id: paymentId,
        product_slug: input.product_slug,
        provider,
        status: "pending",
        access_request_id: input.access_request_id,
        email,
        currency: input.currency,
        amount_subtotal: input.amount_subtotal,
        amount_total: input.amount_total,
        provider_checkout_session_id: input.provider_checkout_session_id,
        provider_payment_intent_id: input.provider_payment_intent_id,
        provider_customer_id: input.provider_customer_id,
        provider_subscription_id: input.provider_subscription_id,
        checkout_url: input.checkout_url,
        paid_at: input.paid_at,
        refunded_at: input.refunded_at,
        metadata: metadataJson,
        created_at: nowIso,
        updated_at: nowIso
      });
      await writeLocalDb(localDb);
    }

    return paymentId;
  }

  const db = await readLocalDb();
  db.product_payments.unshift({
    id: paymentId,
    product_slug: input.product_slug,
    provider,
    status: "pending",
    access_request_id: input.access_request_id,
    email,
    currency: input.currency,
    amount_subtotal: input.amount_subtotal,
    amount_total: input.amount_total,
    provider_checkout_session_id: input.provider_checkout_session_id,
    provider_payment_intent_id: input.provider_payment_intent_id,
    provider_customer_id: input.provider_customer_id,
    provider_subscription_id: input.provider_subscription_id,
    checkout_url: input.checkout_url,
    paid_at: input.paid_at,
    refunded_at: input.refunded_at,
    metadata: metadataJson,
    created_at: nowIso,
    updated_at: nowIso
  });
  await writeLocalDb(db);
  return paymentId;
}

export async function fulfillPaidProductPayment(input: {
  provider?: ProductPayment["provider"];
  product_slug: ProductPayment["product_slug"];
  access_type?: ProductAccessType;
  email: string;
  access_request_id?: string;
  provider_checkout_session_id: string;
  provider_payment_intent_id?: string;
  provider_customer_id?: string;
  provider_subscription_id?: string;
  currency?: string;
  amount_subtotal?: number;
  amount_total?: number;
  paid_at?: string;
  metadata?: Record<string, unknown>;
}) {
  const nowIso = new Date().toISOString();
  const email = input.email.toLowerCase();
  const paidAt = input.paid_at ?? nowIso;
  const provider = input.provider ?? "paypal";
  const providerLabel = "PayPal";
  const entitlementAccessType = input.access_type ?? "paid_pilot";
  const isLifetimeAccess = entitlementAccessType === "lifetime_access";
  const isMonthlySubscription = entitlementAccessType === "monthly_subscription" && Boolean(input.provider_subscription_id);
  const entitlementNotes = isLifetimeAccess
    ? `${providerLabel} lifetime access payment completed.`
    : isMonthlySubscription
      ? `${providerLabel} monthly subscription checkout completed.`
      : `${providerLabel} paid pilot checkout completed.`;
  const metadataJson = JSON.parse(JSON.stringify(input.metadata ?? {}));

  if (hasDatabaseUrl()) {
    const writeSql = getWriteSql();
    const existingPayments = await writeSql<ProductPaymentRow[]>`
      select * from product_payments
      where provider_checkout_session_id = ${input.provider_checkout_session_id}
      limit 1
    `;
    const paymentId = existingPayments[0]?.id ?? randomUUID();
    const accessRequestId = input.access_request_id ?? existingPayments[0]?.access_request_id;

    if (existingPayments[0]) {
      await writeSql`
        update product_payments
        set status = 'paid',
          email = ${email},
          currency = ${input.currency ?? existingPayments[0].currency ?? null},
          amount_subtotal = ${input.amount_subtotal ?? existingPayments[0].amount_subtotal ?? null},
          amount_total = ${input.amount_total ?? existingPayments[0].amount_total ?? null},
          provider_payment_intent_id = ${input.provider_payment_intent_id ?? existingPayments[0].provider_payment_intent_id ?? null},
          provider_customer_id = ${input.provider_customer_id ?? existingPayments[0].provider_customer_id ?? null},
          provider_subscription_id = ${input.provider_subscription_id ?? existingPayments[0].provider_subscription_id ?? null},
          paid_at = ${paidAt},
          metadata = ${writeSql.json({ ...(existingPayments[0].metadata ?? {}), ...metadataJson })},
          updated_at = ${nowIso}
        where id = ${paymentId}
      `;
    } else {
      await writeSql`
        insert into product_payments (
          id, product_slug, provider, status, access_request_id, email, currency,
          amount_subtotal, amount_total, provider_checkout_session_id,
          provider_payment_intent_id, provider_customer_id, provider_subscription_id,
          paid_at, metadata, created_at, updated_at
        ) values (
          ${paymentId}, ${input.product_slug}, ${provider}, 'paid',
          ${accessRequestId ?? null}, ${email}, ${input.currency ?? null},
          ${input.amount_subtotal ?? null}, ${input.amount_total ?? null},
          ${input.provider_checkout_session_id}, ${input.provider_payment_intent_id ?? null},
          ${input.provider_customer_id ?? null}, ${input.provider_subscription_id ?? null},
          ${paidAt}, ${writeSql.json(metadataJson)}, ${nowIso}, ${nowIso}
        )
      `;
    }

    const existingEntitlements = await writeSql<ProductEntitlementRow[]>`
      select * from product_entitlements
      where source_payment_id = ${paymentId}
      limit 1
    `;
    if (!existingEntitlements[0]) {
      await writeSql`
        insert into product_entitlements (
          id, product_slug, access_type, email, status, source_payment_id,
          access_request_id, starts_at, ends_at, notes, metadata, created_at, updated_at
        ) values (
          ${randomUUID()}, ${input.product_slug}, ${entitlementAccessType}, ${email}, 'active',
          ${paymentId}, ${accessRequestId ?? null}, ${paidAt}, ${isLifetimeAccess || isMonthlySubscription ? null : addDaysIso(new Date(paidAt), 30)},
          ${entitlementNotes}, ${writeSql.json(metadataJson)}, ${nowIso}, ${nowIso}
        )
        on conflict (source_payment_id) where source_payment_id is not null do nothing
      `;
    }

    if (accessRequestId) {
      await writeSql`
        update product_access_requests
        set status = 'paid', updated_at = ${nowIso}
        where id = ${accessRequestId}
      `;
    }

    return paymentId;
  }

  const db = await readLocalDb();
  let payment = db.product_payments.find((item) => item.provider_checkout_session_id === input.provider_checkout_session_id);
  if (!payment) {
    payment = {
      id: randomUUID(),
      product_slug: input.product_slug,
      provider,
      status: "paid",
      email,
      access_request_id: input.access_request_id,
      provider_checkout_session_id: input.provider_checkout_session_id,
      created_at: nowIso,
      updated_at: nowIso
    };
    db.product_payments.unshift(payment);
  }

  payment.status = "paid";
  payment.email = email;
  payment.access_request_id = input.access_request_id ?? payment.access_request_id;
  payment.currency = input.currency ?? payment.currency;
  payment.amount_subtotal = input.amount_subtotal ?? payment.amount_subtotal;
  payment.amount_total = input.amount_total ?? payment.amount_total;
  payment.provider_payment_intent_id = input.provider_payment_intent_id ?? payment.provider_payment_intent_id;
  payment.provider_customer_id = input.provider_customer_id ?? payment.provider_customer_id;
  payment.provider_subscription_id = input.provider_subscription_id ?? payment.provider_subscription_id;
  payment.paid_at = paidAt;
  payment.metadata = { ...(payment.metadata ?? {}), ...metadataJson };
  payment.updated_at = nowIso;

  if (!db.product_entitlements.some((item) => item.source_payment_id === payment.id)) {
    db.product_entitlements.unshift({
      id: randomUUID(),
      product_slug: input.product_slug,
      access_type: entitlementAccessType,
      email,
      status: "active",
      source_payment_id: payment.id,
      access_request_id: payment.access_request_id,
      starts_at: paidAt,
      ends_at: isLifetimeAccess || isMonthlySubscription ? undefined : addDaysIso(new Date(paidAt), 30),
      notes: entitlementNotes,
      metadata: metadataJson,
      created_at: nowIso,
      updated_at: nowIso
    });
  }

  if (payment.access_request_id) {
    const request = db.product_access_requests.find((item) => item.id === payment.access_request_id);
    if (request) {
      request.status = "paid";
      request.updated_at = nowIso;
    }
  }

  await writeLocalDb(db);
  return payment.id;
}

export async function getProductPaymentByProviderCheckoutSessionId(
  providerCheckoutSessionId: string
): Promise<ProductPayment | null> {
  if (hasDatabaseUrl()) {
    const sql = getReadSql();
    const rows = await sql<ProductPaymentRow[]>`
      select * from product_payments
      where provider_checkout_session_id = ${providerCheckoutSessionId}
      limit 1
    `;
    return rows[0] ? mapProductPaymentRow(rows[0]) : null;
  }

  const db = await readLocalDbSafe();
  return db.product_payments.find((payment) => payment.provider_checkout_session_id === providerCheckoutSessionId) ?? null;
}

export async function revokeProductAccessForPayment(input: {
  provider_checkout_session_id?: string;
  provider_payment_intent_id?: string;
  refunded_at?: string;
  metadata?: Record<string, unknown>;
}) {
  const nowIso = new Date().toISOString();
  const refundedAt = input.refunded_at ?? nowIso;
  const metadataJson = JSON.parse(JSON.stringify(input.metadata ?? {}));
  await ensureProductLicenseTables();

  if (hasDatabaseUrl()) {
    const writeSql = getWriteSql();
    const paymentRows = await writeSql<ProductPaymentRow[]>`
      select * from product_payments
      where (${input.provider_checkout_session_id ?? null}::text is not null and provider_checkout_session_id = ${input.provider_checkout_session_id ?? null})
        or (${input.provider_payment_intent_id ?? null}::text is not null and provider_payment_intent_id = ${input.provider_payment_intent_id ?? null})
      limit 1
    `;
    const payment = paymentRows[0];
    if (!payment) return null;

    await writeSql`
      update product_payments
      set status = 'refunded',
        refunded_at = ${refundedAt},
        metadata = ${writeSql.json({ ...(payment.metadata ?? {}), ...metadataJson })},
        updated_at = ${nowIso}
      where id = ${payment.id}
    `;
    await writeSql`
      update product_entitlements
      set status = 'revoked', updated_at = ${nowIso}
      where source_payment_id = ${payment.id}
    `;
    await writeSql`
      update product_license_keys
      set status = 'revoked', updated_at = ${nowIso}
      where source_payment_id = ${payment.id}
    `;
    await writeSql`
      update product_license_activations
      set status = 'revoked', revoked_at = ${nowIso}, updated_at = ${nowIso}
      where license_key_id in (
        select id from product_license_keys where source_payment_id = ${payment.id}
      )
    `;
    return mapProductPaymentRow({ ...payment, status: "refunded", refunded_at: refundedAt, metadata: { ...(payment.metadata ?? {}), ...metadataJson }, updated_at: nowIso });
  }

  const db = await readLocalDb();
  const payment = db.product_payments.find(
    (item) =>
      (input.provider_checkout_session_id && item.provider_checkout_session_id === input.provider_checkout_session_id) ||
      (input.provider_payment_intent_id && item.provider_payment_intent_id === input.provider_payment_intent_id)
  );
  if (!payment) return null;
  payment.status = "refunded";
  payment.refunded_at = refundedAt;
  payment.metadata = { ...(payment.metadata ?? {}), ...metadataJson };
  payment.updated_at = nowIso;
  const entitlementIds = new Set<string>();
  for (const entitlement of db.product_entitlements) {
    if (entitlement.source_payment_id === payment.id) {
      entitlement.status = "revoked";
      entitlement.updated_at = nowIso;
      entitlementIds.add(entitlement.id);
    }
  }
  const licenseKeyIds = new Set<string>();
  for (const licenseKey of db.product_license_keys) {
    if (licenseKey.source_payment_id === payment.id || entitlementIds.has(licenseKey.entitlement_id)) {
      licenseKey.status = "revoked";
      licenseKey.updated_at = nowIso;
      licenseKeyIds.add(licenseKey.id);
    }
  }
  for (const activation of db.product_license_activations) {
    if (licenseKeyIds.has(activation.license_key_id)) {
      activation.status = "revoked";
      activation.revoked_at = nowIso;
      activation.updated_at = nowIso;
    }
  }
  await writeLocalDb(db);
  return payment;
}

