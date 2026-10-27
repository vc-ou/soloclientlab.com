import { requireAdmin } from "@/lib/domains/identity";
import { getPeopleRows } from "@/lib/domains/leads";
import { getOrderRows } from "@/lib/domains/commerce";

/**
 * 合并导出（替代原来的 /admin/subscribers/export 与 /admin/waitlists/export）。
 * 用法：/admin/export?type=people | /admin/export?type=orders
 */

function escapeCsv(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(headers: string[], rows: Array<Array<unknown>>) {
  return [headers.join(","), ...rows.map((row) => row.map(escapeCsv).join(","))].join("\n");
}

export async function GET(request: Request) {
  await requireAdmin();

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "people";

  if (type === "orders") {
    const orders = await getOrderRows();
    const csv = toCsv(
      [
        "created_at",
        "paid_at",
        "product_slug",
        "provider",
        "status",
        "amount_total_cents",
        "currency",
        "email",
        "age_hours",
        "entitlement_status",
        "license_key_suffix",
        "active_activations",
        "flags"
      ],
      orders.map((order) => [
        order.payment.created_at,
        order.payment.paid_at ?? "",
        order.payment.product_slug,
        order.payment.provider,
        order.payment.status,
        order.payment.amount_total ?? 0,
        order.payment.currency ?? "USD",
        order.payment.email ?? "",
        order.ageHours,
        order.entitlement?.status ?? "",
        order.licenseKey?.key_suffix ?? "",
        order.activeActivationCount,
        order.flags.join("|")
      ])
    );

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="orders.csv"'
      }
    });
  }

  const [people, orders] = await Promise.all([getPeopleRows(), getOrderRows()]);
  const paidEmails = new Set(
    orders
      .filter((order) => order.payment.status === "paid" && order.payment.email)
      .map((order) => order.payment.email!.toLowerCase())
  );

  const csv = toCsv(
    [
      "email",
      "first_seen_at",
      "last_seen_at",
      "source_type",
      "source_page",
      "persona_tags",
      "topic_tags",
      "interests",
      "access_requests",
      "trials",
      "configs",
      "suggested_action",
      "paid"
    ],
    people.map((person) => [
      person.email,
      person.firstSeenAt,
      person.lastSeenAt,
      person.sourceType ?? "",
      person.sourcePage ?? "",
      person.personaTags.join("|"),
      person.topicTags.join("|"),
      person.interests.join("|"),
      person.accessRequests.length,
      person.trials.length,
      person.configs.length,
      person.suggestedAction,
      paidEmails.has(person.email) ? "yes" : "no"
    ])
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="people.csv"'
    }
  });
}
