"use server";

/**
 * 后台内容：文章 / 辅助页面 / 需求库
 * 从 lib/actions.ts 拆分（S5）。编排层：可以依赖多个域，但不得写 SQL。
 */
import { encodeFormErrorMessage, getOptionalDateTime, getText, hasUnclosedMarkdownCodeFence, parseScore } from "./shared";

import { deletePostById, savePost, saveResource } from "@/lib/domains/content";
import { saveDemand } from "@/lib/domains/leads";
import { getResourceLandingPath } from "@/lib/resource-delivery";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type {
  ActionState,
  DemandStatus,
  EvidenceStrength,
  ResourceDeliveryMode,
  PostStatus,
  ResourceStatus,
  ResourceType,
  TopicTag,
  PostFaqItem
} from "@/lib/types";

export async function upsertPost(formData: FormData) {
  const postId = getText(formData, "id") || undefined;
  const content = getText(formData, "content");

  if (hasUnclosedMarkdownCodeFence(content)) {
    redirect(`/admin/posts/${postId ?? "new"}?error=${encodeFormErrorMessage("文章内容包含未闭合的 Markdown 代码块。请在 Markdown 模式补上或删除 ``` / ~~~ 后再保存。")}`);
  }

  const faqRaw = getText(formData, "faq");
  let faq: PostFaqItem[] | undefined;
  if (faqRaw) {
    try {
      const parsed = JSON.parse(faqRaw);
      if (Array.isArray(parsed)) {
        faq = parsed
          .filter((item) => item && typeof item.question === "string" && typeof item.answer === "string")
          .map((item) => ({ question: item.question, answer: item.answer }));
      }
    } catch {
      // 忽略非法 JSON，避免整篇保存失败
    }
  }

  try {
    await savePost({
      id: postId,
      title: getText(formData, "title"),
      slug: getText(formData, "slug"),
      summary: getText(formData, "summary") || undefined,
      content: content || undefined,
      cover_image_url: getText(formData, "cover_image_url") || undefined,
      topic_tag: (getText(formData, "topic_tag") || undefined) as TopicTag | undefined,
      seo_title: getText(formData, "seo_title") || undefined,
      seo_description: getText(formData, "seo_description") || undefined,
      cta_type: getText(formData, "cta_type") || undefined,
      cta_target: getText(formData, "cta_target") || undefined,
      status: getText(formData, "status") as PostStatus,
      published_at: getOptionalDateTime(formData, "published_at"),
      read_time: getText(formData, "read_time") || undefined,
      faq
    });
  } catch (error) {
    console.error("Failed to save post:", error);
    const fallbackMessage = "Post save failed. Please try again.";
    const message = error instanceof Error && error.message ? error.message : fallbackMessage;
    redirect(`/admin/posts/${postId ?? "new"}?error=${encodeFormErrorMessage(message)}`);
  }

  revalidatePath("/");
  revalidatePath("/research");
  revalidatePath(`/research/${getText(formData, "slug")}`);
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
  redirect("/admin/posts");
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

