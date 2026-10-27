"use server";

/**
 * 公开表单：订阅 / 等待名单 / LeadRadar 反馈
 * 从 lib/actions.ts 拆分（S5）。编排层：可以依赖多个域，但不得写 SQL。
 */
import { getText, leadRadarFeedbackSchema, maybeSyncMailerLite, saveUploadedFeedbackAttachment, subscribeSchema, waitlistSchema } from "./shared";

import { addFeedbackEntry, addWaitlistEntry, getSubscriberByEmail, saveSubscriber } from "@/lib/domains/leads";
import { withDatabaseTimeout } from "@/lib/domains/commerce";
import { trackTrialEvent } from "@/lib/domains/analytics";
import { revalidatePath } from "next/cache";
import type {
  ActionState
} from "@/lib/types";

export async function subscribeUser(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = subscribeSchema.safeParse({
    email: getText(formData, "email").toLowerCase(),
    source_page: getText(formData, "source_page") || undefined,
    source_type: getText(formData, "source_type"),
    lead_magnet: getText(formData, "lead_magnet") || undefined,
    persona_tag: getText(formData, "persona_tag") || undefined,
    topic_tag: getText(formData, "topic_tag") || undefined
  });

  if (!parsed.success) {
    return { success: false, message: "Please enter a valid email address." };
  }

  let existingSubscriber;
  try {
    existingSubscriber = await withDatabaseTimeout(getSubscriberByEmail(parsed.data.email), 1500);
  } catch (error) {
    console.error("Could not check recent subscriber status:", error);
  }

  if (existingSubscriber) {
    const lastSubmittedAt = new Date(existingSubscriber.updated_at).getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    if (!Number.isNaN(lastSubmittedAt) && Date.now() - lastSubmittedAt < thirtyDaysMs) {
      return {
        success: false,
        message: "站主已有您的邮箱，请通过邮箱联系。邮箱地址：soloclientlab.com@gmail.com"
      };
    }
  }

  try {
    await withDatabaseTimeout(saveSubscriber(parsed.data), 3000);
    await maybeSyncMailerLite(parsed.data.email);
  } catch (error) {
    console.error("Could not save subscriber quickly enough:", error);
    return {
      success: false,
      message: "提交暂时没有完成，请通过邮箱联系。邮箱地址：soloclientlab.com@gmail.com"
    };
  }

  revalidatePath("/");
  revalidatePath("/research");
  revalidatePath("/admin");
  revalidatePath("/admin/subscribers");

  return {
    success: true,
    message: "Thanks. I will send it to you by email.",
    eventName: parsed.data.source_type === "resource" ? "resource_signup" : "newsletter_signup"
  };
}


export async function joinWaitlist(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = waitlistSchema.safeParse({
    project_name: getText(formData, "project_name"),
    page_slug: getText(formData, "page_slug"),
    email: getText(formData, "email").toLowerCase(),
    source_page: getText(formData, "source_page") || undefined,
    post_slug: getText(formData, "post_slug") || undefined,
    interest_tag: getText(formData, "interest_tag") || undefined,
    note: getText(formData, "note") || undefined
  });

  if (!parsed.success) {
    return { success: false, message: "Please complete the access request with a valid email." };
  }

  await addWaitlistEntry({
    project_name: parsed.data.project_name,
    page_slug: parsed.data.page_slug,
    email: parsed.data.email,
    source_page: parsed.data.source_page,
    interest_tag: parsed.data.interest_tag,
    note: parsed.data.note
  });
  await saveSubscriber({
    email: parsed.data.email,
    source_page: parsed.data.source_page,
    source_type: "waitlist",
    topic_tag: "manufacturing_social_lead_discovery"
  });

  revalidatePath(`/waitlist/${parsed.data.page_slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/waitlists");
  revalidatePath("/admin/subscribers");

  return { success: true, message: "Your product access request has been received.", eventName: "waitlist_signup" };
}


export async function submitLeadRadarFeedback(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = leadRadarFeedbackSchema.safeParse({
    tool_slug: getText(formData, "tool_slug"),
    source_page: getText(formData, "source_page"),
    is_useful: getText(formData, "is_useful"),
    problem_context: getText(formData, "problem_context")
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please choose whether it was useful and describe what you were trying to solve."
    };
  }

  const attachment = formData.get("attachment");

  try {
    const attachmentUrl = attachment instanceof File ? await saveUploadedFeedbackAttachment(attachment) : undefined;
    await addFeedbackEntry({
      tool_slug: parsed.data.tool_slug,
      source_page: parsed.data.source_page,
      is_useful: parsed.data.is_useful === "useful",
      problem_context: parsed.data.problem_context,
      attachment_url: attachmentUrl,
      attachment_name: attachment instanceof File && attachment.size > 0 ? attachment.name : undefined
    });
  } catch (error) {
    console.error("Failed to submit LeadRadar feedback:", error);
    return {
      success: false,
      message: "Feedback could not be submitted just now. Please try again."
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/feedback");
  await trackTrialEvent({
    product_slug: "leadradar",
    event_type: "calibration_feedback_submitted",
    source_page: parsed.data.source_page
  });

  return {
    success: true,
    message: "Thanks. Your feedback has been recorded.",
    eventName: "tool_feedback_submitted"
  };
}

