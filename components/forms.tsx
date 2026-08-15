"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { trackPlausibleEvent } from "@/components/plausible-events";
import { sendProductEvent } from "@/components/product-events";
import { joinWaitlist, requestProductAccess, submitLeadRadarConfig, subscribeUser } from "@/lib/actions";
import { waitlistInterestOptions } from "@/lib/content";
import type { ActionState, ProductAccessType, ProductSlug, SourceType } from "@/lib/types";

const initialState: ActionState = {
  success: false,
  message: ""
};

const SUBMISSION_TIMEOUT_MESSAGE = "提交暂时没有完成，请通过邮箱联系。邮箱地址：soloclientlab.com@gmail.com";
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

type ProductAccessFormProps = {
  productSlug: ProductSlug;
  sourcePage: string;
  title?: string;
  subtitle?: string;
  defaultAccessType?: ProductAccessType;
  buttonLabel?: string;
};

export function ProductAccessForm({
  productSlug,
  sourcePage,
  title = "Request product access",
  subtitle = "Tell us what you want to test. Subscription checkout is self-serve, and co-build access is arranged through product setup conversations.",
  defaultAccessType = "co_build_access",
  buttonLabel = "Submit request"
}: ProductAccessFormProps) {
  const [state, action, pending] = useActionState(requestProductAccess, initialState);
  const lastTrackedEvent = useRef<string | undefined>(undefined);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    if (state.success && state.eventName && state.eventName !== lastTrackedEvent.current) {
      trackPlausibleEvent(state.eventName);
      lastTrackedEvent.current = state.eventName;
      setShowFeedbackModal(true);
    }
  }, [state]);

  useEffect(() => {
    if (state.message) {
      setShowFeedbackModal(true);
    }
  }, [state.message]);

  return (
    <>
      <form action={action} className="form-card waitlist-card">
        <h3>{title}</h3>
        <p className="form-intro">{subtitle}</p>
        <input type="hidden" name="product_slug" value={productSlug} />
        <input type="hidden" name="source_page" value={sourcePage} />

        <label className="field">
          <span>Email address</span>
          <input name="email" type="email" placeholder="you@example.com" required />
        </label>

        <label className="field">
          <span>Access type</span>
          <select name="access_type" defaultValue={defaultAccessType}>
            <option value="co_build_access">Co-build access</option>
            <option value="product_access">Product access</option>
            <option value="monthly_subscription">Monthly subscription</option>
          </select>
        </label>

        <label className="field">
          <span>Company or workflow name</span>
          <input name="company_name" placeholder="CNC shop, sourcing team, product lab..." />
        </label>

        <label className="field">
          <span>Your role</span>
          <input name="role" placeholder="Founder, sales, sourcing, operations..." />
        </label>

        <label className="field">
          <span>What do you want to test?</span>
          <textarea
            name="use_case"
            rows={4}
            placeholder="Describe the signals, products, customers, or workflow you want to review."
          />
        </label>

        <button type="submit" className="button primary" disabled={pending}>
          {pending ? "Submitting..." : buttonLabel}
        </button>
        {!state.success ? (
          <p className="form-feedback">{state.message || "No spam. Product access is reviewed manually."}</p>
        ) : null}
      </form>

      <FeedbackModal
        open={showFeedbackModal}
        title={state.success ? "Access request received" : "Notice"}
        message={state.message}
        tone={state.success ? "success" : "notice"}
        onClose={() => setShowFeedbackModal(false)}
      />
    </>
  );
}

export function LeadRadarConfigForm({ sourcePage = "/products/leadradar" }: { sourcePage?: string }) {
  const [state, action, pending] = useActionState(submitLeadRadarConfig, initialState);
  const startedRef = useRef(false);
  const lastTrackedEvent = useRef<string | undefined>(undefined);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    if (state.success && state.eventName && state.eventName !== lastTrackedEvent.current) {
      trackPlausibleEvent(state.eventName);
      lastTrackedEvent.current = state.eventName;
      setShowFeedbackModal(true);
    }
  }, [state]);

  useEffect(() => {
    if (state.message) {
      setShowFeedbackModal(true);
    }
  }, [state.message]);

  return (
    <>
      <form
        action={action}
        className="form-card waitlist-card"
        onFocus={() => {
          if (startedRef.current) return;
          startedRef.current = true;
          void sendProductEvent("radar_config_started", { source_page: sourcePage });
        }}
      >
        <h3>Configure LeadRadar with us</h3>
        <p className="form-intro">Share the signal rules your team would use first. This is the co-build configuration input, not a generic waitlist.</p>
        <input type="hidden" name="source_page" value={sourcePage} />

        <label className="field">
          <span>Email address</span>
          <input name="email" type="email" placeholder="you@example.com" required />
        </label>
        <label className="field">
          <span>Company or team</span>
          <input name="company_name" placeholder="Manufacturing team, sourcing agency, CNC shop..." />
        </label>
        <label className="field">
          <span>Target market</span>
          <input name="target_market" placeholder="CNC buyers in North America, custom parts importers..." />
        </label>
        <label className="field">
          <span>Platforms to review</span>
          <input name="platforms" placeholder="TikTok, YouTube Shorts, Instagram, Reddit..." />
        </label>
        <label className="field">
          <span>Keywords or signal phrases</span>
          <textarea name="keywords" rows={3} placeholder="MOQ, quote, sample, CNC machining, supplier, lead time" required />
        </label>
        <label className="field">
          <span>Countries or regions</span>
          <input name="countries" placeholder="US, Germany, Mexico, Canada..." />
        </label>
        <label className="field">
          <span>Capabilities to match</span>
          <textarea name="capabilities" rows={3} placeholder="CNC turning, aluminum parts, tolerances, finishing, packaging..." />
        </label>
        <label className="field">
          <span>Lead types to keep</span>
          <textarea name="lead_types" rows={3} placeholder="Quote requests, sample requests, supplier comparisons, capacity checks..." />
        </label>
        <label className="field">
          <span>Calibration notes</span>
          <textarea name="notes" rows={4} placeholder="What should be filtered out? What would make a signal worth review?" />
        </label>

        <button type="submit" className="button primary" disabled={pending}>
          {pending ? "Submitting..." : "Submit configuration"}
        </button>
        {!state.success ? (
          <p className="form-feedback">{state.message || "Configuration helps decide whether co-build access should unlock."}</p>
        ) : null}
      </form>

      <FeedbackModal
        open={showFeedbackModal}
        title={state.success ? "Configuration received" : "Notice"}
        message={state.message}
        tone={state.success ? "success" : "notice"}
        onClose={() => setShowFeedbackModal(false)}
      />
    </>
  );
}
