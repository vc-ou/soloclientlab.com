"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import { trackPlausibleEvent } from "@/components/plausible-events";
import { joinWaitlist, subscribeUser } from "@/lib/actions";
import { personaOptions, waitlistInterestOptions } from "@/lib/content";
import type { ActionState, SourceType } from "@/lib/types";

const initialState: ActionState = {
  success: false,
  message: ""
};

type NewsletterFormProps = {
  sourceType: SourceType;
  sourcePage: string;
  leadMagnet?: string;
  topicTag?: string;
  personaSelect?: boolean;
  buttonLabel?: string;
  compact?: boolean;
  title?: string;
  subtitle?: string;
};

export function NewsletterForm({
  sourceType,
  sourcePage,
  leadMagnet,
  topicTag,
  personaSelect = false,
  buttonLabel = "Subscribe",
  compact = false,
  title,
  subtitle
}: NewsletterFormProps) {
  const [state, action, pending] = useActionState(subscribeUser, initialState);
  const lastTrackedEvent = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (state.success && state.eventName && state.eventName !== lastTrackedEvent.current) {
      trackPlausibleEvent(state.eventName);
      lastTrackedEvent.current = state.eventName;
    }
  }, [state]);

  return (
    <form action={action} className={`form-card${compact ? " compact-form" : ""}`}>
      {title ? <h3>{title}</h3> : null}
      {subtitle ? <p className="form-intro">{subtitle}</p> : null}
      <input type="hidden" name="source_type" value={sourceType} />
      <input type="hidden" name="source_page" value={sourcePage} />
      {leadMagnet ? <input type="hidden" name="lead_magnet" value={leadMagnet} /> : null}
      {topicTag ? <input type="hidden" name="topic_tag" value={topicTag} /> : null}

      <div className="form-grid">
        <label className="field">
          <span>Email address</span>
          <input name="email" type="email" placeholder="you@example.com" required />
        </label>

        {personaSelect ? (
          <label className="field">
            <span>What best describes you? (optional)</span>
            <select name="persona_tag" defaultValue="">
              <option value="">Select your role</option>
              {personaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <button type="submit" className="button primary" disabled={pending}>
        {pending ? "Submitting..." : buttonLabel}
      </button>
      <p className={`form-feedback${state.success ? " success" : ""}`}>
        {state.message || "No spam. Unsubscribe anytime."}
      </p>
      {state.success && state.redirectUrl ? (
        <Link href={state.redirectUrl} className="button secondary form-followup-link" target="_blank" rel="noreferrer">
          {state.redirectLabel ?? "Open the report"}
        </Link>
      ) : null}
    </form>
  );
}

type WaitlistFormProps = {
  projectName: string;
  pageSlug: string;
};

export function WaitlistForm({ projectName, pageSlug }: WaitlistFormProps) {
  const [state, action, pending] = useActionState(joinWaitlist, initialState);
  const lastTrackedEvent = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (state.success && state.eventName && state.eventName !== lastTrackedEvent.current) {
      trackPlausibleEvent(state.eventName);
      lastTrackedEvent.current = state.eventName;
    }
  }, [state]);

  return (
    <form action={action} className="form-card waitlist-card">
      <h3>Join the waitlist</h3>
      <p className="form-intro">Tell us where your acquisition process feels stuck, and we will notify you when the workflow is ready.</p>
      <input type="hidden" name="project_name" value={projectName} />
      <input type="hidden" name="page_slug" value={pageSlug} />
      <input type="hidden" name="source_page" value={`/waitlist/${pageSlug}`} />

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

      <button type="submit" className="button primary" disabled={pending}>
        {pending ? "Joining..." : "Join the waitlist"}
      </button>
      <p className={`form-feedback${state.success ? " success" : ""}`}>
        {state.message || "We respect your privacy. No spam. Unsubscribe anytime."}
      </p>
    </form>
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
