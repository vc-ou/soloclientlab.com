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
    <AdminShell title="后台不可用">
      <section className="admin-card" style={{ display: "grid", gap: 16 }}>
        <div>
          <h2 style={{ marginBottom: 8 }}>无法加载后台实时数据</h2>
          <p>
            后台在显示旧种子数据之前就中断了。等实时数据库连接恢复后再重试。
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button type="button" className="button primary" onClick={() => reset()}>
            重试
          </button>
          <a href="/admin" className="button ghost">
            重新加载后台
          </a>
        </div>
      </section>
    </AdminShell>
  );
}
