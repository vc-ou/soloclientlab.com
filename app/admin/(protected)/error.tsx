"use client";

import { useEffect } from "react";
import { AdminShell } from "@/components/admin";

export default function AdminProtectedError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin route failed to load live data:", error);
  }, [error]);

  return (
    <AdminShell title="Admin unavailable">
      <section className="admin-card" style={{ display: "grid", gap: 16 }}>
        <div>
          <h2 style={{ marginBottom: 8 }}>Could not load live admin data</h2>
          <p>
            The dashboard stopped before showing stale seed data. Please retry once the live database connection is available.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button type="button" className="button primary" onClick={() => reset()}>
            Retry
          </button>
          <a href="/admin" className="button ghost">
            Reload admin
          </a>
        </div>
      </section>
    </AdminShell>
  );
}
