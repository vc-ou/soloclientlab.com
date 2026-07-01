"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removePost } from "@/lib/actions";
import type { ActionState } from "@/lib/types";

type PostRowActionsProps = {
  postId: string;
  postSlug: string;
  onDeleteSuccess: (postId: string) => void;
};

type NavButtonProps = {
  href: string;
  idleLabel: string;
  pendingLabel: string;
  className: string;
  newTab?: boolean;
};

const initialDeleteState: ActionState = {
  success: false,
  message: ""
};

function NavButton({
  href,
  idleLabel,
  pendingLabel,
  className,
  newTab = false
}: NavButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpening, setIsOpening] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const pending = isPending || isOpening;

  return (
    <button
      type="button"
      className={`${className} ${pending ? "is-pending" : ""}`.trim()}
      aria-busy={pending}
      disabled={pending}
      onClick={() => {
        if (newTab) {
          setIsOpening(true);
          const nextWindow = window.open(href, "_blank", "noopener,noreferrer");

          if (!nextWindow) {
            window.location.assign(href);
            return;
          }

          resetTimerRef.current = window.setTimeout(() => {
            setIsOpening(false);
            resetTimerRef.current = null;
          }, 1200);
          return;
        }

        startTransition(() => {
          router.push(href);
        });
      }}
    >
      {pending ? <span className="button-spinner" aria-hidden="true" /> : null}
      <span>{pending ? pendingLabel : idleLabel}</span>
    </button>
  );
}

function DeleteForm({
  postId,
  onDeleteSuccess
}: {
  postId: string;
  onDeleteSuccess: (postId: string) => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(removePost, initialDeleteState);

  useEffect(() => {
    if (!state.success) return;

    onDeleteSuccess(postId);
    router.refresh();
  }, [onDeleteSuccess, postId, router, state.success]);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={postId} />
      <button
        type="submit"
        className={`button ghost button-sm button-danger ${pending ? "is-pending" : ""}`.trim()}
        aria-busy={pending}
        disabled={pending}
      >
        {pending ? <span className="button-spinner" aria-hidden="true" /> : null}
        <span>{pending ? "Deleting..." : "Delete"}</span>
      </button>
      {state.message && !state.success ? <p className="admin-action-feedback">{state.message}</p> : null}
    </form>
  );
}

export function PostRowActions({ postId, postSlug, onDeleteSuccess }: PostRowActionsProps) {
  return (
    <div className="admin-table-actions">
      <NavButton
        href={`/admin/posts/${postId}/preview`}
        idleLabel="Preview"
        pendingLabel="Opening..."
        className="button ghost button-sm"
        newTab
      />
      <NavButton
        href={`/admin/posts/${postId}`}
        idleLabel="Edit"
        pendingLabel="Loading..."
        className="button secondary button-sm"
      />
      <DeleteForm postId={postId} onDeleteSuccess={onDeleteSuccess} />
    </div>
  );
}
