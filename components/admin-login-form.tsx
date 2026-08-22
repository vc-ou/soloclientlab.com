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
        <p className="eyebrow">后台</p>
        <h1 style={{ fontSize: "3rem" }}>登录</h1>
        <p className="lede">使用你的 Supabase Auth 管理员账号进入 SoloClientLab.com 后台。</p>
      </div>
      <label className="field">
        <span>邮箱</span>
        <input type="email" name="email" autoComplete="email" required />
      </label>
      <label className="field">
        <span>密码</span>
        <input type="password" name="password" autoComplete="current-password" required />
      </label>
      <button type="submit" className="button primary" disabled={pending}>
        {pending ? "登录中..." : "登录"}
      </button>
      {state.message ? <p className="form-feedback">{state.message}</p> : null}
    </form>
  );
}
