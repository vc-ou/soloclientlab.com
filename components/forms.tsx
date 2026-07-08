"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { trackPlausibleEvent } from "@/components/plausible-events";
import { joinWaitlist, subscribeUser } from "@/lib/actions";
import { waitlistInterestOptions } from "@/lib/content";
import type { ActionState, SourceType } from "@/lib/types";

const initialState: ActionState = {
  success: false,
  message: ""
};

const SUBMISSION_TIMEOUT_MESSAGE = "提交暂时没有完成，请通过邮箱联系。邮箱地址：soloclientlab.com@gmail.com";
const SUBMISSION_TIMEOUT_MS = 6000;

async function trackPostCtaClick(postSlug: string) {
  try {
    await fetch("/api/post-events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        postSlug,
        eventType: "cta_click",
        ctaType: "newsletter",
        path: window.location.pathname,
        referrer: document.referrer || undefined
      }),
      keepalive: true
    });
  } catch {
    // Form submission should not depend on analytics.
  }
}

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

type NewsletterFormProps = {
  sourceType: SourceType;
  sourcePage: string;
  topicTag?: string;
  postSlug?: string;
  buttonLabel?: string;
  compact?: boolean;
  title?: string;
  subtitle?: string;
};

export function NewsletterForm({
  sourceType,
  sourcePage,
  topicTag,
  postSlug,
  buttonLabel = "Subscribe",
  compact = false,
  title,
  subtitle
}: NewsletterFormProps) {
  const [state, action, pending] = useActionState(subscribeUser, initialState);
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
        className={`form-card${compact ? " compact-form" : ""}`}
        onSubmit={() => {
          if (sourceType === "post" && postSlug) {
            void trackPostCtaClick(postSlug);
          }
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
        {title ? <h3>{title}</h3> : null}
        {subtitle ? <p className="form-intro">{subtitle}</p> : null}
        <input type="hidden" name="source_type" value={sourceType} />
        <input type="hidden" name="source_page" value={sourcePage} />
        {topicTag ? <input type="hidden" name="topic_tag" value={topicTag} /> : null}
        {postSlug ? <input type="hidden" name="post_slug" value={postSlug} /> : null}

        <div className="form-grid">
          <label className="field">
            <span>Email address</span>
            <input name="email" type="email" placeholder="you@example.com" required />
          </label>
        </div>

        <button type="submit" className="button primary" disabled={pending && !timedOut}>
          {pending && !timedOut ? "Submitting..." : buttonLabel}
        </button>
        {(!state.success || timedOut) ? (
          <p className={`form-feedback${state.success ? " success" : ""}`}>
            {feedbackMessage || "No spam. Unsubscribe anytime."}
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
        <h3>Join the waitlist</h3>
        <p className="form-intro">Tell us where your acquisition process feels stuck, and we will notify you when the workflow is ready.</p>
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
          {pending && !timedOut ? "Joining..." : "Join the waitlist"}
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

export function InlineCta({
  title,
  body,
  children
}: {
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <section className="inline-cta">
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      {children}
    </section>
  );
}
