"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { addWaitlistEntry, deletePostById, deleteSubscriberById, getSubscriberByEmail, saveDemand, savePost, saveResource, saveSubscriber, updateSubscriberNote, withDatabaseTimeout } from "@/lib/db";
import { signInAdmin, signOutAdmin } from "@/lib/auth";
import { getResourceLandingPath } from "@/lib/resource-delivery";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ActionState,
  DemandStatus,
  EvidenceStrength,
  PostCtaType,
  ResourceDeliveryMode,
  PostStatus,
  ResourceStatus,
  ResourceType,
  TopicTag
} from "@/lib/types";

const emailSchema = z.string().trim().email();

const subscribeSchema = z.object({
  email: emailSchema,
  source_page: z.string().optional(),
  source_type: z.enum(["home", "post", "resource", "newsletter_page", "waitlist"]),
  lead_magnet: z.string().optional(),
  persona_tag: z.string().optional(),
  topic_tag: z.string().optional()
});

const waitlistSchema = z.object({
  project_name: z.string().min(1),
  page_slug: z.string().min(1),
  email: emailSchema,
  source_page: z.string().optional(),
  post_slug: z.string().optional(),
  interest_tag: z.string().optional(),
  note: z.string().optional()
});

function getText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getOptionalDateTime(formData: FormData, key: string) {
  const value = getText(formData, key);
  if (!value) return undefined;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function encodeFormErrorMessage(message: string) {
  return encodeURIComponent(message);
}

function getPostImageBucketName() {
  return process.env.SUPABASE_POSTS_BUCKET
    ?? process.env.NEXT_PUBLIC_SUPABASE_POSTS_BUCKET
    ?? "posts";
}

async function saveUploadedPostImage(file: File) {
  if (!file || file.size === 0) {
    return undefined;
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : undefined;
  const safeExtension = extension && /^[a-z0-9]+$/.test(extension) ? extension : "jpg";
  const filename = `${Date.now()}-${randomUUID()}.${safeExtension}`;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    const supabase = await createSupabaseServerClient();
    const bucket = getPostImageBucketName();
    const objectPath = `posts/${filename}`;
    const { error } = await supabase.storage.from(bucket).upload(objectPath, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false
    });

    if (error) {
      throw new Error(`Cover image upload failed: ${error.message}`);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    if (!data.publicUrl) {
      throw new Error("Cover image upload failed: no public URL was returned.");
    }

    return data.publicUrl;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "posts");

  await mkdir(uploadDir, { recursive: true });

  const outputPath = path.join(uploadDir, filename);
  await writeFile(outputPath, buffer);

  return `/uploads/posts/${filename}`;
}

async function maybeSyncMailerLite(_email: string) {
  // Local save remains the source of truth when MailerLite is not configured.
}

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
  revalidatePath("/newsletter");
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
    return { success: false, message: "Please complete the waitlist form with a valid email." };
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
    topic_tag: "client_acquisition"
  });

  revalidatePath(`/waitlist/${parsed.data.page_slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/waitlists");
  revalidatePath("/admin/subscribers");

  return { success: true, message: "You're on the waitlist.", eventName: "waitlist_signup" };
}

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

function parseScore(value: string) {
  if (!value) return undefined;
  const number = Number(value);
  if (Number.isNaN(number)) return undefined;
  return number;
}

export async function upsertDemand(formData: FormData) {
  const scores = ["pain_score", "frequency_score", "payment_score"].map((key) => parseScore(getText(formData, key)));
  if (scores.some((score) => score !== undefined && (score < 1 || score > 5))) {
    throw new Error("Scores must be between 1 and 5.");
  }

  await saveDemand({
    id: getText(formData, "id") || undefined,
    title: getText(formData, "title"),
    source_url: getText(formData, "source_url") || undefined,
    source_platform: getText(formData, "source_platform") || undefined,
    user_quote: getText(formData, "user_quote") || undefined,
    persona: getText(formData, "persona") || undefined,
    job_to_be_done: getText(formData, "job_to_be_done") || undefined,
    problem_stage: getText(formData, "problem_stage") || undefined,
    solution_attempted: getText(formData, "solution_attempted") || undefined,
    keyword: getText(formData, "keyword") || undefined,
    pain_score: scores[0],
    frequency_score: scores[1],
    payment_score: scores[2],
    evidence_strength: (getText(formData, "evidence_strength") || undefined) as EvidenceStrength | undefined,
    status: getText(formData, "status") as DemandStatus,
    tags: getText(formData, "tags")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    next_action: getText(formData, "next_action") || undefined,
    topic_tag: (getText(formData, "topic_tag") || undefined) as TopicTag | undefined
  });

  revalidatePath("/admin");
  revalidatePath("/admin/demands");
  redirect("/admin/demands");
}

export async function upsertPost(formData: FormData) {
  const relatedDemandIds = formData.getAll("related_demand_ids")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
  const postId = getText(formData, "id") || undefined;

  try {
    const coverImage = formData.get("cover_image");
    const existingCoverImageUrl = getText(formData, "existing_cover_image_url") || undefined;
    const removeCoverImage = getText(formData, "remove_cover_image") === "on";
    const uploadedCoverImageUrl = coverImage instanceof File ? await saveUploadedPostImage(coverImage) : undefined;

    await savePost({
      id: postId,
      title: getText(formData, "title"),
      slug: getText(formData, "slug"),
      summary: getText(formData, "summary") || undefined,
      content: getText(formData, "content") || undefined,
      cover_image_url: removeCoverImage ? undefined : uploadedCoverImageUrl ?? existingCoverImageUrl,
      related_persona: getText(formData, "related_persona") || undefined,
      related_demand_ids: relatedDemandIds,
      topic_tag: (getText(formData, "topic_tag") || undefined) as TopicTag | undefined,
      seo_title: getText(formData, "seo_title") || undefined,
      seo_description: getText(formData, "seo_description") || undefined,
      cta_type: getText(formData, "cta_type") as PostCtaType,
      cta_target: getText(formData, "cta_target") || undefined,
      status: getText(formData, "status") as PostStatus,
      published_at: getOptionalDateTime(formData, "published_at"),
      read_time: getText(formData, "read_time") || undefined,
      hero_label: getText(formData, "hero_label") || undefined
    });
  } catch (error) {
    console.error("Failed to save post:", error);
    const fallbackMessage = "Post save failed. Please try again.";
    const message = error instanceof Error && error.message ? error.message : fallbackMessage;
    redirect(`/admin/posts/${postId ?? "new"}?error=${encodeFormErrorMessage(message)}`);
  }

  revalidatePath("/");
  revalidatePath("/research");
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}

export async function upsertResource(formData: FormData) {
  const resource = {
    id: getText(formData, "id") || undefined,
    title: getText(formData, "title"),
    slug: getText(formData, "slug"),
    type: getText(formData, "type") as ResourceType,
    audience: getText(formData, "audience") || undefined,
    related_topic: (getText(formData, "related_topic") || undefined) as TopicTag | undefined,
    landing_page_slug: getText(formData, "landing_page_slug") || undefined,
    delivery_mode: (getText(formData, "delivery_mode") || undefined) as ResourceDeliveryMode | undefined,
    delivery_url: getText(formData, "delivery_url") || undefined,
    status: getText(formData, "status") as ResourceStatus
  };

  await saveResource(resource);

  revalidatePath(getResourceLandingPath(resource));
  revalidatePath("/admin/resources");
  redirect("/admin/resources");
}

export async function removePost(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = getText(formData, "id");
  if (!id) {
    return { success: false, message: "Post id is required." };
  }

  try {
    await deletePostById(id);
  } catch (error) {
    console.error("Failed to delete post:", error);
    return { success: false, message: "Delete failed. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/research");
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
  return { success: true, message: "Post deleted." };
}

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
