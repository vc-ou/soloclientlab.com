import Link from "next/link";
import { AdminNav } from "@/components/admin-nav";
import { logoutAdmin } from "@/lib/actions";
import { formatDate } from "@/lib/format";

export function AdminShell({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div>
          <p className="admin-brand">SoloClientLab.com Admin</p>
          <AdminNav />
        </div>
        <form action={logoutAdmin}>
          <button type="submit" className="button ghost full-width">
            Sign out
          </button>
        </form>
      </aside>
      <main className="admin-main">
        <div className="admin-topbar">
          <h1>{title}</h1>
          <Link href="/products" className="button ghost">
            View products
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="metric-card">
      <p>{label}</p>
      <strong>{value}</strong>
      {hint ? <span className="metric-hint">{hint}</span> : null}
    </div>
  );
}

export function InsightCard({
  title,
  value,
  body
}: {
  title: string;
  value: string;
  body: string;
}) {
  return (
    <section className="activity-card insight-card">
      <p className="insight-label">{title}</p>
      <strong>{value}</strong>
      <p>{body}</p>
    </section>
  );
}

export function SimpleTable({
  headers,
  rows
}: {
  headers: string[];
  rows: Array<Array<React.ReactNode>>;
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={`${index}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ActivityList({
  title,
  items
}: {
  title: string;
  items: Array<{ primary: string; secondary?: string; meta?: string }>;
}) {
  return (
    <section className="activity-card">
      <h2>{title}</h2>
      <div className="activity-list">
        {items.map((item, index) => (
          <div key={`${item.primary}-${index}`} className="activity-item">
            <div>
              <strong>{item.primary}</strong>
              {item.secondary ? <p>{item.secondary}</p> : null}
            </div>
            {item.meta ? <span>{item.meta}</span> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function AdminMeta({ label }: { label?: string }) {
  return label ? <span className="admin-pill">{label}</span> : null;
}

export function FormActions() {
  return (
    <div className="admin-form-actions">
      <button type="submit" className="button primary">
        Save
      </button>
      <Link href="/admin" className="button ghost">
        Cancel
      </Link>
    </div>
  );
}

export function DateText({ value }: { value?: string }) {
  return <span>{formatDate(value)}</span>;
}

export function FilterForm({
  children,
  action,
  resetHref
}: {
  children: React.ReactNode;
  action?: string;
  resetHref: string;
}) {
  return (
    <form action={action} className="admin-filter-form">
      {children}
      <div className="admin-filter-actions">
        <button type="submit" className="button primary">
          Apply filters
        </button>
        <Link href={resetHref} className="button ghost">
          Reset
        </Link>
      </div>
    </form>
  );
}
