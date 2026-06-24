"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type AdminLinkButtonProps = {
  href: string;
  idleLabel: string;
  pendingLabel: string;
  className: string;
};

export function AdminLinkButton({
  href,
  idleLabel,
  pendingLabel,
  className
}: AdminLinkButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={`${className} ${isPending ? "is-pending" : ""}`.trim()}
      aria-busy={isPending}
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          router.push(href);
        });
      }}
    >
      {isPending ? <span className="button-spinner" aria-hidden="true" /> : null}
      <span>{isPending ? pendingLabel : idleLabel}</span>
    </button>
  );
}
