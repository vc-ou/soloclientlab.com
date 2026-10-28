/**
 * 表单解析、错误编码、上传等共用工具（非 Server Action 模块）。
 */
import path from "node:path";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { z } from "zod";
import type { ProductFeature } from "@/lib/types";

const emailSchema = z.string().trim().email();


export const subscribeSchema = z.object({
  email: emailSchema,
  source_page: z.string().optional(),
  source_type: z.enum(["home", "post", "resource", "newsletter_page", "waitlist"]),
  lead_magnet: z.string().optional(),
  persona_tag: z.string().optional(),
  topic_tag: z.string().optional()
});


export const waitlistSchema = z.object({
  project_name: z.string().min(1),
  page_slug: z.string().min(1),
  email: emailSchema,
  source_page: z.string().optional(),
  post_slug: z.string().optional(),
  interest_tag: z.string().optional(),
  note: z.string().optional()
});


export const leadRadarFeedbackSchema = z.object({
  tool_slug: z.literal("leadradar"),
  source_page: z.string().min(1),
  is_useful: z.enum(["useful", "not_useful"]),
  problem_context: z.string().trim().min(1).max(4000)
});


export const productAccessSchema = z.object({
  product_slug: z.enum(["leadradar", "needradar-workflow-lab"]),
  access_type: z.enum(["product_access", "trial_access", "co_build_access", "partner_preview", "paid_pilot", "monthly_subscription"]),
  email: emailSchema,
  company_name: z.string().trim().max(160).optional(),
  role: z.string().trim().max(160).optional(),
  source_page: z.string().trim().max(300).optional(),
  use_case: z.string().trim().max(4000).optional()
});


export const productCheckoutSchema = z.object({
  product_slug: z.string().trim().min(1).max(120),
  source_page: z.string().trim().max(300).optional()
});


export const paidPilotCheckoutSchema = z.object({
  email: emailSchema,
  company_name: z.string().trim().min(1).max(160),
  role: z.string().trim().max(160).optional(),
  use_case: z.string().trim().min(1).max(4000),
  source_page: z.string().trim().max(300).optional()
});


export const leadRadarConfigSchema = z.object({
  email: emailSchema,
  company_name: z.string().trim().max(160).optional(),
  target_market: z.string().trim().max(500).optional(),
  platforms: z.string().trim().max(500).optional(),
  keywords: z.string().trim().max(1200),
  countries: z.string().trim().max(500).optional(),
  capabilities: z.string().trim().max(1200).optional(),
  lead_types: z.string().trim().max(1200).optional(),
  notes: z.string().trim().max(4000).optional(),
  source_page: z.string().trim().max(300).optional()
});


export function getText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}


export function getOptionalDateTime(formData: FormData, key: string) {
  const value = getText(formData, key);
  if (!value) return undefined;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}


export function hasUnclosedMarkdownCodeFence(content: string) {
  let fenceMarker: "`" | "~" | null = null;
  let fenceLength = 0;

  for (const line of content.replace(/\r\n/g, "\n").split("\n")) {
    const fence = line.match(/^\s*(`{3,}|~{3,})/);
    if (!fence) continue;

    const marker = fence[1][0] as "`" | "~";
    const length = fence[1].length;

    if (!fenceMarker) {
      fenceMarker = marker;
      fenceLength = length;
      continue;
    }

    if (marker === fenceMarker && length >= fenceLength) {
      fenceMarker = null;
      fenceLength = 0;
    }
  }

  return fenceMarker !== null;
}


export function parsePriceCents(value: string) {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error("价格必须是数字，最多保留两位小数。");
  }

  const [whole, fraction = ""] = trimmed.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}


export function parseProductFeatures(value: string): ProductFeature[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((line) => {
      const [title, ...bodyParts] = line.split("|");
      const cleanTitle = title.trim();
      const body = bodyParts.join("|").trim();
      return body ? { title: cleanTitle, body } : { title: cleanTitle };
    })
    .filter((feature) => feature.title);
}


export function parseLandingPageUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("落地页地址格式不正确，请填写站内路径或完整的 http(s) 地址。");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("落地页地址只能使用站内路径或 http(s) 地址。");
  }

  return url.toString();
}


export function encodeFormErrorMessage(message: string) {
  return encodeURIComponent(message);
}


export function getPostImageBucketName() {
  return process.env.SUPABASE_POSTS_BUCKET
    ?? process.env.NEXT_PUBLIC_SUPABASE_POSTS_BUCKET
    ?? "posts";
}


export function getFeedbackUploadBucketName() {
  return process.env.SUPABASE_FEEDBACK_BUCKET
    ?? process.env.NEXT_PUBLIC_SUPABASE_FEEDBACK_BUCKET
    ?? getPostImageBucketName();
}


export async function saveUploadedFeedbackAttachment(file: File) {
  if (!file || file.size === 0) {
    return undefined;
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() : undefined;
  const safeExtension = extension && /^[a-z0-9]+$/.test(extension) ? extension : "bin";
  const filename = `${Date.now()}-${randomUUID()}.${safeExtension}`;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    const supabase = await createSupabaseServerClient();
    const bucket = getFeedbackUploadBucketName();
    const objectPath = `feedback/${filename}`;
    const { error } = await supabase.storage.from(bucket).upload(objectPath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

    if (error) {
      throw new Error(`Feedback attachment upload failed: ${error.message}`);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    if (!data.publicUrl) {
      throw new Error("Feedback attachment upload failed: no public URL was returned.");
    }

    return data.publicUrl;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "feedback");
  await mkdir(uploadDir, { recursive: true });
  const outputPath = path.join(uploadDir, filename);
  await writeFile(outputPath, buffer);

  return `/uploads/feedback/${filename}`;
}


export async function maybeSyncMailerLite(_email: string) {
  // Local save remains the source of truth when MailerLite is not configured.
}


export function parseScore(value: string) {
  if (!value) return undefined;
  const number = Number(value);
  if (Number.isNaN(number)) return undefined;
  return number;
}

