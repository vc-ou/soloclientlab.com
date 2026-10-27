"use server";

/**
 * 后台线索：备注与删除
 * 从 lib/actions.ts 拆分（S5）。编排层：可以依赖多个域，但不得写 SQL。
 */
import { getText } from "./shared";

import { deleteSubscriberById, updateSubscriberNote } from "@/lib/domains/leads";
import { revalidatePath } from "next/cache";
import type {
  ActionState
} from "@/lib/types";

export async function updateSubscriberNoteAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = getText(formData, "id");
  const note = getText(formData, "note");

  if (!id) {
    return { success: false, message: "Subscriber id is required." };
  }

  try {
    await updateSubscriberNote(id, note);
  } catch (error) {
    console.error("Failed to save subscriber note:", error);
    return { success: false, message: "Could not save the note. Please try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/subscribers");
  return { success: true, message: "Note saved." };
}


export async function removeSubscriberAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = getText(formData, "id");

  if (!id) {
    return { success: false, message: "Subscriber id is required." };
  }

  try {
    await deleteSubscriberById(id);
  } catch (error) {
    console.error("Failed to delete subscriber:", error);
    return { success: false, message: "Delete failed. Please try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/subscribers");
  return { success: true, message: "Subscriber deleted." };
}

