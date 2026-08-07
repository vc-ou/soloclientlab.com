import Link from "next/link";
import { AdminShell, MetricCard, SimpleTable } from "@/components/admin";
import { getProductAdminMetrics, getProductEntitlements, getProductPayments } from "@/lib/db";
import type { ProductEntitlement, ProductPayment } from "@/lib/types";

function formatUsd(cents?: number) {
  if (cents === undefined) return "-";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(cents / 100);
}

export default async function AdminProductsPage() {
  const [metricsResult, paymentsResult, entitlementsResult] = await Promise.allSettled([
    getProductAdminMetrics(),
    getProductPayments(),
    getProductEntitlements()
  ]);
  const loadErrors = [metricsResult, paymentsResult, entitlementsResult]
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason instanceof Error ? result.reason.message : "Unknown admin data error");
  const metrics = metricsResult.status === "fulfilled"
    ? metricsResult.value
    : {
        accessRequests: 0,
        activeTrials: 0,
        paidPayments: 0,
        paidRevenueCents: 0,
        activeEntitlements: 0,
        completedConfigs: 0,
        productPageVisits: 0,
        trialAccessRequested: 0,
        paypalAccessStarted: 0,
        partnerPreviewRequested: 0,
        installClicked: 0,
        configStarted: 0,
        configCompleted: 0,
        keywordsAdded: 0,
        reviewCompleted: 0,
        csvExported: 0,
        calibrationFeedbackSubmitted: 0,
        paidPilotRequested: 0,
        latestEvents: []
      };
  const payments: ProductPayment[] = paymentsResult.status === "fulfilled" ? paymentsResult.value : [];
  const entitlements: ProductEntitlement[] = entitlementsResult.status === "fulfilled" ? entitlementsResult.value : [];

  return (
    <AdminShell title="Products">
      {loadErrors.length ? (
        <section className="admin-card" style={{ marginBottom: 24 }}>
          <h2>Live product data partially unavailable</h2>
          <p>Some product admin data could not be loaded. Retry after the database connection settles.</p>
        </section>
      ) : null}
      <div className="admin-grid metrics">
        <MetricCard label="Product visits" value={metrics.productPageVisits} />
        <MetricCard label="Access requests" value={metrics.accessRequests} />
        <MetricCard label="Partner previews" value={metrics.partnerPreviewRequested} />
        <MetricCard label="Completed configs" value={metrics.completedConfigs} />
        <MetricCard label="PayPal checkout starts" value={metrics.paypalAccessStarted} />
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
              ["PayPal access", "paypal_access_started", metrics.paypalAccessStarted.toString()]
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
