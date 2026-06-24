import { requireAdmin } from "@/lib/auth";
import { getFilteredWaitlists } from "@/lib/db";

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replaceAll("\"", "\"\"")}"`;
  }
  return value;
}

export async function GET(request: Request) {
  await requireAdmin();

  const { searchParams } = new URL(request.url);
  const waitlists = await getFilteredWaitlists({
    project_name: searchParams.get("project_name") || undefined,
    page_slug: searchParams.get("page_slug") || undefined,
    interest_tag: searchParams.get("interest_tag") || undefined,
    source_page: searchParams.get("source_page") || undefined
  });

  const headers = [
    "project_name",
    "page_slug",
    "email",
    "interest_tag",
    "source_page",
    "note",
    "created_at"
  ];

  const rows = waitlists.map((entry) => [
    entry.project_name,
    entry.page_slug,
    entry.email,
    entry.interest_tag ?? "",
    entry.source_page ?? "",
    entry.note ?? "",
    entry.created_at
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((value) => escapeCsv(value)).join(","))
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="waitlists.csv"'
    }
  });
}
