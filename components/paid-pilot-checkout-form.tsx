"use client";

import { useActionState, useEffect } from "react";
import { createPaidPilotCheckout } from "@/lib/actions";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {
  success: false,
  message: ""
};

export function PaidPilotCheckoutForm({ sourcePage }: { sourcePage: string }) {
  const [state, action, pending] = useActionState(createPaidPilotCheckout, initialState);

  useEffect(() => {
    if (state.success && state.redirectUrl) {
      window.location.assign(state.redirectUrl);
    }
  }, [state]);

  return (
    <form action={action} className="form-card waitlist-card">
      <h3>Buy the 30-day paid pilot</h3>
      <p className="form-intro">
        Pay securely with PayPal. The pilot includes a focused LeadRadar setup and a 30-day evaluation window.
      </p>
      <input type="hidden" name="source_page" value={sourcePage} />

      <label className="field">
        <span>Email address</span>
        <input name="email" type="email" placeholder="you@example.com" required />
      </label>

      <label className="field">
        <span>Company or workflow name</span>
        <input name="company_name" placeholder="CNC shop, sourcing team, product lab..." required />
      </label>

      <label className="field">
        <span>Your role (optional)</span>
        <input name="role" placeholder="Founder, sales, sourcing, operations..." />
      </label>

      <label className="field">
        <span>What should the pilot help you review?</span>
        <textarea
          name="use_case"
          rows={4}
          placeholder="Describe the signal types, markets, capabilities, or workflow you want to test."
          required
        />
      </label>

      <button type="submit" className="button primary" disabled={pending}>
        {pending ? "Opening PayPal..." : "Buy paid pilot"}
      </button>
      <p className={`form-feedback${state.success ? " success" : ""}`} aria-live="polite">
        {state.message || "Your payment is handled by PayPal. We do not store card details."}
      </p>
    </form>
  );
}
