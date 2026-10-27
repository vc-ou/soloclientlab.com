"use server";

/**
 * 后台登录与登出
 * 从 lib/actions.ts 拆分（S5）。编排层：可以依赖多个域，但不得写 SQL。
 */
import { getText } from "./shared";

import { redirect } from "next/navigation";
import { signInAdmin } from "@/lib/domains/identity";
import { signOutAdmin } from "@/lib/domains/identity";
import type {
  ActionState
} from "@/lib/types";

export async function loginAdmin(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = getText(formData, "email");
  const password = getText(formData, "password");
  const success = await signInAdmin(email, password);

  if (!success) {
    return { success: false, message: "Incorrect Supabase email or password." };
  }

  redirect("/admin");
}


export async function logoutAdmin() {
  await signOutAdmin();
  redirect("/admin/login");
}

