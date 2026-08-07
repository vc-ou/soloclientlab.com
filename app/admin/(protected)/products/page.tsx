import Link from "next/link";
import { AdminShell, MetricCard, SimpleTable } from "@/components/admin";
import { getProductAdminMetrics, getProductEntitlements, getProductPayments } from "@/lib/db";

function formatUsd(cents?: number) {
  if (cents === undefined) return "-";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(cents / 100);
}

export default async function AdminProductsPage() {
  const [metrics, payments, entitlements] = await Promise.all([
    getProductAdminMetrics(),
    getProductPayments(),
    getProductEntitlements()
  ]);

  return (
    <AdminShell title="Products">
      <div className="admin-grid metrics">
        <MetricCard label="Product visits" value={metrics.productPageVisits} />
        <MetricCard label="Access requests" value={metrics.accessRequests} />
        <MetricCard label="Partner previews" value={metrics.partnerPreviewRequested} />
        <MetricCard label="Completed configs" value={metrics.completedConfigs} />
        <MetricCard label="Paid pilot requests" value={metrics.paidPilotRequested} />
        <MetricCard label="Paid payments" value={metrics.paidPayments} />
        <MetricCard label="Paid revenue" value={formatUsd(metrics.paidRevenueCents)} />
        <MetricCard label="Active entitlements" value={metrics.activeEntitlements} />
      </div>

      <div className="admin-grid" style={{ marginTop: 24 }}>
        <section className="activity-card">
          <h2>Payments</h2>
          <SimpleTable
            headers={["Created", "Provider", "Product", "Email", "Status", "Amount", "Paid at", "Payment reference"]}
            rows={payments.map((payment) => [
              payment.created_at.slice(0, 16).replace("T", " "),
              payment.provider,
              payment.product_slug,
              payment.email,
              payment.status,
              formatUsd(payment.amount_total),
              payment.paid_at?.slice(0, 16).replace("T", " ") ?? "-",
              payment.provider_checkout_session_id ?? "-"
            ])}
          />
        </section>
      </div>

      <div className="admin-grid" style={{ marginTop: 24 }}>
        <section className="activity-card">
          <h2>Entitlements</h2>
          <SimpleTable
            headers={["Created", "Product", "Email", "Access", "Status", "Starts", "Ends", "Source payment"]}
            rows={entitlements.map((entitlement) => [
              entitlement.created_at.slice(0, 16).replace("T", " "),
              entitlement.product_slug,
              entitlement.email,
              entitlement.access_type,
              entitlement.status,
              entitlement.starts_at.slice(0, 10),
              entitlement.ends_at?.slice(0, 10) ?? "-",
              entitlement.source_payment_id ?? "-"
            ])}
          />
        </section>
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
