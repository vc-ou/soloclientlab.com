"use client";

import { useActionState } from "react";
import { lookupLicense, type LicenseLookupState } from "@/lib/actions";

const initialState: LicenseLookupState = { status: "idle", message: "" };

export function LicenseLookupForm() {
  const [state, formAction, pending] = useActionState(lookupLicense, initialState);

  return (
    <div className="section-panel narrow-panel">
      <form action={formAction} className="admin-form" style={{ display: "grid", gap: 14 }}>
        <label className="field">
          <span>购买时使用的邮箱</span>
          <input name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
        </label>
        <label className="field">
          <span>订单号，或授权码后 8 位</span>
          <input name="identifier" required minLength={6} placeholder="例如 5O190127TN364715T 或 VR87-6YTU" />
          <small className="field-help">
            订单号在付款完成页或 PayPal 收据里；授权码后 8 位可以在你保存的截图中看到。
          </small>
        </label>
        <button type="submit" className="button primary" disabled={pending}>
          {pending ? "查询中…" : "查找我的授权码"}
        </button>
      </form>

      {state.status === "ok" && state.licenseKey ? (
        <div className="license-key-panel" style={{ marginTop: 22 }}>
          <p className="eyebrow">Your license key</p>
          <code>{state.licenseKey}</code>
          <p>
            商品：{state.productSlug} · 可激活 {state.maxActivations} 台，已激活 {state.activeActivations} 台。
            把它粘贴到扩展首次启动的输入框即可。
          </p>
        </div>
      ) : null}

      {state.status === "error" ? (
        <p className="queue-empty" style={{ marginTop: 18, borderLeft: "3px solid #c0392b" }}>
          {state.message}
        </p>
      ) : null}

      <p className="metric-hint" style={{ marginTop: 18 }}>
        仍然找不到？发邮件到 soloclientlab.com@gmail.com，附上付款截图与购买邮箱，我会手工核对。
      </p>
    </div>
  );
}
