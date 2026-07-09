import Link from "next/link";
import { AdminShell, FilterForm, SimpleTable } from "@/components/admin";
import { getFeedbackSourcePageOptions, getFilteredFeedback } from "@/lib/db";

type AdminFeedbackPageProps = {
  searchParams: Promise<{
    tool_slug?: string;
    is_useful?: string;
    has_attachment?: string;
    source_page?: string;
  }>;
};

export default async function AdminFeedbackPage({ searchParams }: AdminFeedbackPageProps) {
  const filters = await searchParams;
  const [feedback, sourcePageOptions] = await Promise.all([
    getFilteredFeedback(filters),
    getFeedbackSourcePageOptions()
  ]);

  return (
    <AdminShell title="Feedback">
      <div className="admin-topbar">
        <p>Review demo feedback by usefulness, attachment presence, or source page.</p>
        <Link href="/tools/leadradar" className="button ghost">
          View LeadRadar
        </Link>
      </div>
      <FilterForm resetHref="/admin/feedback">
        <label className="field">
          <span>Tool</span>
          <select name="tool_slug" defaultValue={filters.tool_slug ?? ""}>
            <option value="">All tools</option>
            <option value="leadradar">LeadRadar</option>
          </select>
        </label>
        <label className="field">
          <span>Useful</span>
          <select name="is_useful" defaultValue={filters.is_useful ?? ""}>
            <option value="">All responses</option>
            <option value="yes">Useful</option>
            <option value="no">Not useful</option>
          </select>
        </label>
        <label className="field">
          <span>Attachment</span>
          <select name="has_attachment" defaultValue={filters.has_attachment ?? ""}>
            <option value="">All</option>
            <option value="yes">Has attachment</option>
            <option value="no">No attachment</option>
          </select>
        </label>
        <label className="field">
          <span>Source page</span>
          <select name="source_page" defaultValue={filters.source_page ?? ""}>
            <option value="">All pages</option>
            {sourcePageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </FilterForm>
      <SimpleTable
        headers={["Created", "Tool", "Useful", "Original problem", "Attachment", "Source page"]}
        rows={feedback.map((entry) => [
          entry.created_at.slice(0, 16).replace("T", " "),
          entry.tool_slug,
          entry.is_useful ? "Useful" : "Not useful",
          entry.problem_context,
          entry.attachment_url ? (
            <a href={entry.attachment_url} target="_blank" rel="noreferrer">
              {entry.attachment_name ?? "Open attachment"}
            </a>
          ) : "—",
          entry.source_page ?? "—"
        ])}
      />
    </AdminShell>
  );
}
