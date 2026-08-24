"use client";

import { useFormStatus } from "react-dom";

function SyncButtonContent() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="button secondary" disabled={pending} aria-busy={pending}>
      {pending ? <span className="button-spinner" aria-hidden="true" /> : null}
      <span>{pending ? "同步中..." : "同步代码商品"}</span>
    </button>
  );
}

export function SyncCodeProductsButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <SyncButtonContent />
    </form>
  );
}
