import { requireAdmin } from "@/lib/auth";
import { getFilteredSubscribers } from "@/lib/db";

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replaceAll("\"", "\"\"")}"`;
  }
  return value;
}

export async function GET(request: Request) {
  await requireAdmin();

  const { searchParams } = new URL(request.url);
  const subscribers = await getFilteredSubscribers({
    source_type: searchParams.get("source_type") || undefined,
    lead_magnet: searchParams.get("lead_magnet") || undefined,
    persona_tag: searchParams.get("persona_tag") || undefined,
    topic_tag: searchParams.get("topic_tag") || undefined,
    status: searchParams.get("status") || undefined
  });

  const headers = [
    "email",
    "source_type",
    "source_page",
    "lead_magnet",
    "persona_tag",
    "topic_tag",
    "status",
    "created_at"
  ];

  const rows = subscribers.map((subscriber) => [
    subscriber.email,
    subscriber.source_type ?? "",
    subscriber.source_page ?? "",
    subscriber.lead_magnet ?? "",
    subscriber.persona_tag ?? "",
    subscriber.topic_tag ?? "",
    subscriber.status,
    subscriber.created_at
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((value) => escapeCsv(value)).join(","))
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="subscribers.csv"'
    }
  });
}
