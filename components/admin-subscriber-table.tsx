"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Subscriber } from "@/lib/types";
import type { ActionState } from "@/lib/types";
import { removeSubscriberAction, updateSubscriberNoteAction } from "@/lib/actions";

const initialState: ActionState = {
  success: false,
  message: ""
};

function DeleteSubscriberButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(removeSubscriberAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form action={action} className="admin-inline-form">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="button ghost danger-button"
        disabled={pending}
        onClick={(event) => {
          if (!window.confirm("Delete this subscriber? This cannot be undone.")) {
            event.preventDefault();
          }
        }}
      >
        {pending ? "Deleting..." : "Delete"}
      </button>
      {state.message ? <p className={`admin-action-feedback${state.success ? " success" : ""}`}>{state.message}</p> : null}
    </form>
  );
}

function SubscriberNoteModal({
  subscriber,
  open,
  onClose
}: {
  subscriber: Subscriber | null;
  open: boolean;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(updateSubscriberNoteAction, initialState);
  const [noteValue, setNoteValue] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (subscriber && open) {
      setNoteValue(subscriber.note ?? "");
    }
  }, [subscriber, open]);

  useEffect(() => {
    if (state.success && open) {
      router.refresh();
      onClose();
    }
  }, [router, state.success, open, onClose]);

  if (!open || !subscriber) {
    return null;
  }

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="admin-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscriber-note-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-modal-header">
          <div>
            <p className="eyebrow">Subscriber note</p>
            <h2 id="subscriber-note-title">{subscriber.email}</h2>
          </div>
          <button type="button" className="button ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <form action={action} className="admin-modal-form">
          <input type="hidden" name="id" value={subscriber.id} />
          <label className="field">
            <span>Note</span>
            <textarea
              name="note"
              rows={8}
              value={noteValue}
              onChange={(event) => setNoteValue(event.target.value)}
              placeholder="Add follow-up context, lead quality notes, or manual outreach status."
            />
          </label>

          {state.message ? <p className={`admin-action-feedback${state.success ? " success" : ""}`}>{state.message}</p> : null}

          <div className="admin-modal-actions">
            <button type="button" className="button ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button primary" disabled={pending}>
              {pending ? "Saving..." : "Save note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminSubscriberTable({ subscribers }: { subscribers: Subscriber[] }) {
  const [activeSubscriber, setActiveSubscriber] = useState<Subscriber | null>(null);
  const [modalVersion, setModalVersion] = useState(0);

  return (
    <>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Source type</th>
              <th>Source page</th>
              <th>Lead magnet</th>
              <th>Persona</th>
              <th>Topic</th>
              <th>Status</th>
              <th>Created</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((subscriber) => (
              <tr key={subscriber.id}>
                <td>{subscriber.email}</td>
                <td>{subscriber.source_type ?? "—"}</td>
                <td>{subscriber.source_page ?? "—"}</td>
                <td>{subscriber.lead_magnet ?? "—"}</td>
                <td>{subscriber.persona_tag ?? "—"}</td>
                <td>{subscriber.topic_tag ?? "—"}</td>
                <td>{subscriber.status}</td>
                <td>{subscriber.created_at.slice(0, 10)}</td>
                <td>
                  <div className="admin-table-actions">
                    <button
                      type="button"
                      className="button ghost"
                      onClick={() => {
                        setModalVersion((current) => current + 1);
                        setActiveSubscriber(subscriber);
                      }}
                    >
                      Note
                    </button>
                    <DeleteSubscriberButton id={subscriber.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SubscriberNoteModal
        key={`${activeSubscriber?.id ?? "subscriber-note"}-${modalVersion}`}
        subscriber={activeSubscriber}
        open={Boolean(activeSubscriber)}
        onClose={() => setActiveSubscriber(null)}
      />
    </>
  );
}
