import { AdminShell, FormActions } from "@/components/admin";
import { upsertResource } from "@/lib/actions";
import Link from "next/link";
import { getResourceById, getResourcePerformance } from "@/lib/db";
import { getResourceDeliveryLabel, getResourceDeliveryPath, getResourceLandingPath } from "@/lib/resource-delivery";

type ResourceEditorProps = {
  params: Promise<{ id: string }>;
};

export default async function ResourceEditorPage({ params }: ResourceEditorProps) {
  const { id } = await params;
  const resource = id === "new" ? null : await getResourceById(id);
  const performance = resource
    ? (await getResourcePerformance()).find((item) => item.id === resource.id)
    : null;
  const landingPath = resource ? getResourceLandingPath(resource) : null;
  const deliveryPath = resource ? getResourceDeliveryPath(resource) : null;

  return (
    <AdminShell title={resource ? "Edit Secondary Page" : "New Secondary Page"}>
      <form action={upsertResource} className="admin-form">
        <input type="hidden" name="id" value={resource?.id ?? ""} />
        <div className="admin-fields-2">
          <label className="field">
            <span>Title</span>
            <input name="title" defaultValue={resource?.title ?? ""} required />
          </label>
          <label className="field">
            <span>Slug</span>
            <input name="slug" defaultValue={resource?.slug ?? ""} required />
          </label>
          <label className="field">
            <span>Type</span>
            <select name="type" defaultValue={resource?.type ?? "report"}>
              {["report", "checklist", "template", "prompt_pack"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select name="status" defaultValue={resource?.status ?? "draft"}>
              {["draft", "published", "archived"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Audience</span>
            <input name="audience" defaultValue={resource?.audience ?? ""} />
          </label>
          <label className="field">
            <span>Related topic</span>
            <input name="related_topic" defaultValue={resource?.related_topic ?? ""} />
          </label>
          <label className="field">
            <span>Landing page slug</span>
            <input name="landing_page_slug" defaultValue={resource?.landing_page_slug ?? ""} />
            <small className="field-help">Used by the public secondary page and internal routing.</small>
          </label>
          <label className="field">
            <span>Delivery mode</span>
            <select name="delivery_mode" defaultValue={resource?.delivery_mode ?? "page"}>
              <option value="page">page</option>
              <option value="file">file</option>
              <option value="external">external</option>
            </select>
            <small className="field-help">`page` uses the internal page flow, `file` serves a download route, and `external` opens a hosted URL.</small>
          </label>
          <label className="field">
            <span>Delivery URL / file path</span>
            <input name="delivery_url" defaultValue={resource?.delivery_url ?? ""} />
            <small className="field-help">For `page`, use an internal page path. For `file`, use a public file path. For `external`, use the full hosted URL.</small>
          </label>
        </div>
        {resource ? (
          <section className="admin-card resource-preview-card">
            <div className="resource-preview-header">
              <div>
                <h2>Secondary page preview</h2>
                <p>Quick checks for the secondary subscription or delivery flow.</p>
              </div>
              <span className="admin-pill">{performance?.subscriberCount ?? 0} subscribers</span>
            </div>
            <div className="resource-preview-links">
              {landingPath ? (
                <Link href={landingPath} target="_blank" rel="noreferrer" className="button secondary">
                  Open landing page
                </Link>
              ) : null}
              {deliveryPath ? (
                <Link href={deliveryPath} target="_blank" rel="noreferrer" className="button ghost">
                  {getResourceDeliveryLabel(resource)}
                </Link>
              ) : null}
            </div>
            <div className="resource-preview-stats">
              <div>
                <strong>{performance?.subscriberCount ?? 0}</strong>
                <span>Contacts</span>
              </div>
              <div>
                <strong>{Math.round((performance?.conversionRate ?? 0) * 100)}%</strong>
                <span>Conversion share</span>
              </div>
            </div>
          </section>
        ) : null}
        <FormActions />
      </form>
    </AdminShell>
  );
}
