"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { trackPlausibleEvent } from "@/components/plausible-events";
import { joinWaitlist } from "@/lib/actions";
import { waitlistInterestOptions } from "@/lib/content";
import type { ActionState } from "@/lib/types";

/**
 * 等待名单表单（唯一仍被使用的表单组件）。
 *
 * 原 components/forms.tsx（478 行）还包含 NewsletterForm / InlineCta /
 * ProductAccessForm / LeadRadarConfigForm，但它们已没有任何调用方
 * （文章内联订阅与产品访问都改走 PayPal 流程），属死代码，已删除。
 * 需要恢复时从 git 历史取回。
 */

const initialState: ActionState = {
  success: false,
  message: ""
};

const SUBMISSION_TIMEOUT_MESSAGE =
  "The submission did not finish. Please try again, or email soloclientlab.com@gmail.com.";
const SUBMISSION_TIMEOUT_MS = 6000;

function FeedbackModal({
  open,
  title,
  message,
  tone = "success",
  onClose
}: {
  open: boolean;
  title: string;
  message: string;
  tone?: "success" | "notice";
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="success-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="success-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`success-modal-icon ${tone === "notice" ? "is-notice" : ""}`} aria-hidden="true">
          {tone === "notice" ? "!" : "✓"}
        </div>
        <h3 id="success-modal-title">{title}</h3>
        <p>{message}</p>
        <button type="button" className="button primary" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}

type WaitlistFormProps = {
  projectName: string;
  pageSlug: string;
  sourcePage?: string;
  postSlug?: string;
};

export function WaitlistForm({ projectName, pageSlug, sourcePage, postSlug }: WaitlistFormProps) {
  const [state, action, pending] = useActionState(joinWaitlist, initialState);
  const lastTrackedEvent = useRef<string | undefined>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const feedbackMessage = timedOut ? SUBMISSION_TIMEOUT_MESSAGE : state.message;

  useEffect(() => {
    if (state.success && state.eventName && state.eventName !== lastTrackedEvent.current) {
      trackPlausibleEvent(state.eventName);
      lastTrackedEvent.current = state.eventName;
    }
  }, [state]);

  useEffect(() => {
    if (state.message) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setTimedOut(false);
      setShowFeedbackModal(true);
    }
  }, [state.message]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <form
        action={action}
        className="form-card waitlist-card"
        onSubmit={() => {
          setTimedOut(false);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => {
            setTimedOut(true);
            setShowFeedbackModal(true);
          }, SUBMISSION_TIMEOUT_MS);
        }}
      >
        <h3>Request product access</h3>
        <p className="form-intro">Tell us what you want to test so we can match product access or co-build access to the right workflow.</p>
        <input type="hidden" name="project_name" value={projectName} />
        <input type="hidden" name="page_slug" value={pageSlug} />
        <input type="hidden" name="source_page" value={sourcePage ?? `/waitlist/${pageSlug}`} />
        {postSlug ? <input type="hidden" name="post_slug" value={postSlug} /> : null}

        <label className="field">
          <span>Email address</span>
          <input name="email" type="email" placeholder="you@example.com" required />
        </label>

        <label className="field">
          <span>What interests you most? (optional)</span>
          <select name="interest_tag" defaultValue="">
            <option value="">Select what interests you</option>
            {waitlistInterestOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Anything else we should know? (optional)</span>
          <textarea
            name="note"
            rows={4}
            placeholder="Tell us where leads, positioning, content, or follow-up currently breaks down."
          />
        </label>

        <button type="submit" className="button primary" disabled={pending && !timedOut}>
          {pending && !timedOut ? "Requesting..." : "Request access"}
        </button>
        {(!state.success || timedOut) ? (
          <p className={`form-feedback${state.success ? " success" : ""}`}>
            {feedbackMessage || "We respect your privacy. No spam. Unsubscribe anytime."}
          </p>
        ) : null}
      </form>

      <FeedbackModal
        open={showFeedbackModal}
        title={state.success && !timedOut ? "Success" : "Notice"}
        message={feedbackMessage}
        tone={state.success && !timedOut ? "success" : "notice"}
        onClose={() => setShowFeedbackModal(false)}
      />
    </>
  );
}
