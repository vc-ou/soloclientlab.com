import Link from "next/link";
import { AdminShell } from "@/components/admin";
import { getTodaySnapshot } from "@/lib/domains/analytics";

function formatValue(value: number, unit: "count" | "money") {
  return unit === "money" ? `$${(value / 100).toFixed(2)}` : String(value);
}

function DeltaChip({ value, previous }: { value: number; previous: number }) {
  if (!previous) {
    return <span className="delta is-flat">新</span>;
  }
  const delta = Math.round(((value - previous) / previous) * 100);
  if (delta === 0) return <span className="delta is-flat">持平</span>;
  return (
    <span className={`delta ${delta > 0 ? "is-up" : "is-down"}`}>
      {delta > 0 ? "↑" : "↓"} {Math.abs(delta)}%
    </span>
  );
}

export default async function AdminTodayPage() {
  const snapshot = await getTodaySnapshot();
  const totalActions = snapshot.queues.reduce((sum, queue) => sum + queue.count, 0);

  return (
    <AdminShell title="今日">
      <div className="today-head">
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>
          {totalActions > 0
            ? `有 ${totalActions} 件待处理；队列按「会不会影响收钱」排序。`
            : "全部队列为空。今天不需要处理任何运营动作。"}
        </p>
        <span style={{ color: "var(--muted)", fontSize: 12 }}>
          数据时间 {new Date(snapshot.generatedAt).toISOString().slice(0, 16).replace("T", " ")} UTC
        </span>
      </div>

      <div className="today-metrics">
        {snapshot.metrics.map((metric) => (
          <div className="today-metric" key={metric.key}>
            <p>{metric.label}</p>
            <strong>{formatValue(metric.value, metric.unit)}</strong>
            {metric.key === "customers" ? null : <DeltaChip value={metric.value} previous={metric.previous} />}
            <span className="metric-hint">{metric.hint}</span>
          </div>
        ))}
      </div>

      <div className="today-queues">
        {snapshot.queues.map((queue) => {
          const tone = queue.key === "anomalies" || queue.key === "stuck_payments" ? "is-danger" : "is-warn";
          return (
            <section className="queue-card" key={queue.key}>
              <header>
                <h2>{queue.title}</h2>
                <span className={`queue-count ${queue.count > 0 ? tone : ""}`}>{queue.count}</span>
              </header>
              <p className="queue-question">{queue.question}</p>

              {queue.items.length > 0 ? (
                <ul className="queue-list">
                  {queue.items.map((item, index) => (
                    <li
                      key={`${queue.key}-${index}`}
                      className={
                        item.tone === "danger" ? "is-danger" : item.tone === "warn" ? "is-warn" : "is-muted"
                      }
                    >
                      {item.href ? <Link href={item.href}>{item.title}</Link> : <strong>{item.title}</strong>}
                      <small>{item.detail}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="queue-empty">{queue.emptyHint}</p>
              )}

              <div className="queue-footer">
                <Link href={queue.href}>查看全部 →</Link>
              </div>
            </section>
          );
        })}
      </div>
    </AdminShell>
  );
}
