import Link from "next/link";
import { AdminShell, MetricCard, SimpleTable } from "@/components/admin";
import { getProductAdminMetrics } from "@/lib/db";

export default async function AdminProductsPage() {
  const metrics = await getProductAdminMetrics();

  return (
    <AdminShell title="Products">
      <div className="admin-grid metrics">
        <MetricCard label="Product visits" value={metrics.productPageVisits} />
        <MetricCard label="Access requests" value={metrics.accessRequests} />
        <MetricCard label="Partner previews" value={metrics.partnerPreviewRequested} />
        <MetricCard label="Completed configs" value={metrics.completedConfigs} />
        <MetricCard label="Paid pilot requests" value={metrics.paidPilotRequested} />
      </div>

      <div className="admin-grid" style={{ marginTop: 24 }}>
        <section className="activity-card">
          <h2>Product validation funnel</h2>
          <SimpleTable
            headers={["Stage", "V2 event", "Count"]}
            rows={[
              ["Product page", "product_page_visit", metrics.productPageVisits.toString()],
              ["Trial", "trial_access_requested", metrics.trialAccessRequested.toString()],
              ["Partner preview", "partner_preview_requested", metrics.partnerPreviewRequested.toString()],
              ["Install", "install_clicked", metrics.installClicked.toString()],
              ["Configure", "radar_config_started", metrics.configStarted.toString()],
              ["Configure", "radar_config_completed", metrics.configCompleted.toString()],
              ["Configure", "keywords_added", metrics.keywordsAdded.toString()],
              ["Review", "review_completed", metrics.reviewCompleted.toString()],
              ["Export", "csv_exported", metrics.csvExported.toString()],
              ["Feedback", "calibration_feedback_submitted", metrics.calibrationFeedbackSubmitted.toString()],
              ["Paid pilot", "paid_pilot_requested", metrics.paidPilotRequested.toString()]
            ]}
          />
        </section>
      </div>

      <div className="admin-grid" style={{ marginTop: 24 }}>
        <section className="activity-card">
          <h2>Product pages</h2>
          <SimpleTable
            headers={["Product", "Status", "Public page", "Admin follow-up"]}
            rows={[
              [
                "LeadRadar for CNC / Manufacturing",
                "Active",
                <Link key="leadradar" href="/products/leadradar">/products/leadradar</Link>,
                <Link key="configs" href="/admin/leadradar-configs">Configs</Link>
              ],
              [
                "NeedRadar Workflow Lab",
                "Workflow lab",
                <Link key="needradar" href="/products/needradar-workflow-lab">/products/needradar-workflow-lab</Link>,
                <Link key="access" href="/admin/product-access">Access requests</Link>
              ]
            ]}
          />
        </section>
      </div>
    </AdminShell>
  );
}
