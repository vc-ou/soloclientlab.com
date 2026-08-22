"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatAdminLabel } from "@/lib/admin-labels";
import { topicLabels, personaOptions } from "@/lib/content";
import type { Subscriber } from "@/lib/types";
import type { ActionState } from "@/lib/types";
import { removeSubscriberAction, updateSubscriberNoteAction } from "@/lib/actions";

const initialState: ActionState = {
  success: false,
  message: ""
};

type SubscriberNoteModalProps = {
  subscriber: Subscriber | null;
  open: boolean;
  onClose: () => void;
  onSaved: (subscriberId: string, note: string) => void;
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
          if (!window.confirm("确定删除这个联系人吗？此操作不可撤销。")) {
            event.preventDefault();
          }
        }}
      >
        {pending ? "删除中..." : "删除"}
      </button>
      {state.message ? <p className={`admin-action-feedback${state.success ? " success" : ""}`}>{state.message}</p> : null}
    </form>
  );
}

function SubscriberNoteModal({
  subscriber,
  open,
  onClose,
  onSaved
}: SubscriberNoteModalProps) {
  const [state, action, pending] = useActionState(updateSubscriberNoteAction, initialState);
  const [noteValue, setNoteValue] = useState("");

  useEffect(() => {
    if (subscriber && open) {
      setNoteValue(subscriber.note ?? "");
    }
  }, [subscriber, open]);

  useEffect(() => {
    if (state.success && open && subscriber) {
      onSaved(subscriber.id, noteValue);
      onClose();
    }
  }, [state.success, open, onClose, onSaved, subscriber, noteValue]);

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
            <p className="eyebrow">联系人备注</p>
            <h2 id="subscriber-note-title">{subscriber.email}</h2>
          </div>
          <button type="button" className="button ghost" onClick={onClose}>
            关闭
          </button>
        </div>

        <form action={action} className="admin-modal-form">
          <input type="hidden" name="id" value={subscriber.id} />
          <label className="field">
            <span>备注</span>
            <textarea
              name="note"
              rows={8}
              value={noteValue}
              onChange={(event) => setNoteValue(event.target.value)}
              placeholder="记录跟进背景、线索质量、人工联系状态等。"
            />
          </label>

          {state.message ? <p className={`admin-action-feedback${state.success ? " success" : ""}`}>{state.message}</p> : null}

          <div className="admin-modal-actions">
            <button type="button" className="button ghost" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="button primary" disabled={pending}>
              {pending ? "保存中..." : "保存备注"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminSubscriberTable({ subscribers }: { subscribers: Subscriber[] }) {
  const [subscriberRows, setSubscriberRows] = useState(subscribers);
  const [activeSubscriber, setActiveSubscriber] = useState<Subscriber | null>(null);
  const [modalVersion, setModalVersion] = useState(0);

  useEffect(() => {
    setSubscriberRows(subscribers);
  }, [subscribers]);

  const handleNoteSaved = (subscriberId: string, nextNote: string) => {
    setSubscriberRows((current) => current.map((subscriber) => (
      subscriber.id === subscriberId
        ? { ...subscriber, note: nextNote || undefined }
        : subscriber
    )));
  };

  return (
    <>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>邮箱</th>
              <th>来源类型</th>
              <th>来源页面</th>
              <th>旧来源</th>
              <th>用户类型</th>
              <th>主题</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {subscriberRows.map((subscriber) => (
              <tr key={subscriber.id}>
                <td>{subscriber.email}</td>
                <td>{formatAdminLabel(subscriber.source_type)}</td>
                <td>{subscriber.source_page ?? "—"}</td>
                <td>{subscriber.lead_magnet ?? "—"}</td>
                <td>{personaOptions.find((option) => option.value === subscriber.persona_tag)?.label ?? "—"}</td>
                <td>{subscriber.topic_tag ? topicLabels[subscriber.topic_tag as keyof typeof topicLabels] ?? subscriber.topic_tag : "—"}</td>
                <td>{formatAdminLabel(subscriber.status)}</td>
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
                      备注
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
        onSaved={handleNoteSaved}
      />
    </>
  );
}
