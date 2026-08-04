import { AdminShell, SimpleTable } from "@/components/admin";
import { getProductTrials, getTrialEvents } from "@/lib/db";

export default async function AdminTrialsPage() {
  const [trials, events] = await Promise.all([
    getProductTrials(),
    getTrialEvents()
  ]);

  return (
    <AdminShell title="Trials">
      <div className="admin-grid" style={{ marginBottom: 24 }}>
        <section className="activity-card">
          <h2>Trial windows</h2>
          <p>Public self-serve trials use a 7-day window. Partner preview follows offline collaboration progress and is tracked in Product Access, not forced into this trial table.</p>
          <SimpleTable
            headers={["Created", "Product", "Email", "Status", "Trial ends", "Co-build unlock ends", "Source"]}
            rows={trials.map((trial) => [
              trial.created_at.slice(0, 10),
              trial.product_slug,
              trial.email,
              trial.status,
              trial.trial_ends_at?.slice(0, 10) ?? "-",
              trial.co_build_unlock_ends_at?.slice(0, 10) ?? "-",
              trial.source_page ?? "-"
            ])}
          />
        </section>
      </div>

      <section className="activity-card">
        <h2>Effective trial events</h2>
        <p>Localhost, test referrers, ignored IPs, browser opt-out visits, and configured internal emails are excluded from this table.</p>
        <SimpleTable
          headers={["Created", "Product", "Event", "Email", "Path", "Referrer"]}
          rows={events.slice(0, 30).map((event) => [
            event.created_at.slice(0, 16).replace("T", " "),
            event.product_slug,
            event.event_type,
            event.email ?? "-",
            event.path ?? event.source_page ?? "-",
            event.referrer ?? "-"
          ])}
        />
      </section>
    </AdminShell>
  );
}
