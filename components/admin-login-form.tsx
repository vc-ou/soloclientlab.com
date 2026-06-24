"use client";

import { useActionState } from "react";
import { loginAdmin } from "@/lib/actions";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {
  success: false,
  message: ""
};

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, initialState);

  return (
    <form action={action} className="auth-card">
      <div>
        <p className="eyebrow">Admin</p>
        <h1 style={{ fontSize: "3rem" }}>Sign in</h1>
        <p className="lede">Use your Supabase Auth admin account to access the SoloClientLab.com dashboard.</p>
      </div>
      <label className="field">
        <span>Email</span>
        <input type="email" name="email" autoComplete="email" required />
      </label>
      <label className="field">
        <span>Password</span>
        <input type="password" name="password" autoComplete="current-password" required />
      </label>
      <button type="submit" className="button primary" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </button>
      {state.message ? <p className="form-feedback">{state.message}</p> : null}
    </form>
  );
}
