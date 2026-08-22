"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { addFeedbackEntry, addLeadRadarConfig, addPendingProductPayment, addProductAccessRequest, addWaitlistEntry, deletePostById, deleteSubscriberById, getProductById, getProductBySlug, getSubscriberByEmail, saveDemand, savePost, saveProduct, saveResource, saveSubscriber, trackTrialEvent, updateSubscriberNote, withDatabaseTimeout } from "@/lib/db";
import { requireAdmin, signInAdmin, signOutAdmin } from "@/lib/auth";
import { getResourceLandingPath } from "@/lib/resource-delivery";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createPayPalPaidPilotOrder, createPayPalProductOrder } from "@/lib/paypal";
import { getProductMonthlySubscriptionPriceId, getStripe } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/env";
import type {
  ActionState,
  DemandStatus,
  EvidenceStrength,
  ResourceDeliveryMode,
  PostStatus,
  ResourceStatus,
  ResourceType,
  ProductAccessType,
  ProductDeliveryMode,
  ProductDevelopmentStatus,
  ProductStatus,
  ProductSlug,
  TopicTag,
  PostFaqItem
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

const leadRadarFeedbackSchema = z.object({
  tool_slug: z.literal("leadradar"),
  source_page: z.string().min(1),
  is_useful: z.enum(["useful", "not_useful"]),
  problem_context: z.string().trim().min(1).max(4000)
});

const productAccessSchema = z.object({
  product_slug: z.enum(["leadradar", "needradar-workflow-lab"]),
  access_type: z.enum(["product_access", "trial_access", "co_build_access", "partner_preview", "paid_pilot", "monthly_subscription"]),
  email: emailSchema,
  company_name: z.string().trim().max(160).optional(),
  role: z.string().trim().max(160).optional(),
  source_page: z.string().trim().max(300).optional(),
  use_case: z.string().trim().max(4000).optional()
});

const monthlySubscriptionCheckoutSchema = z.object({
  product_slug: z.string().trim().min(1).max(120),
  source_page: z.string().trim().max(300).optional()
});

const paidPilotCheckoutSchema = z.object({
  email: emailSchema,
  company_name: z.string().trim().min(1).max(160),
  role: z.string().trim().max(160).optional(),
  use_case: z.string().trim().min(1).max(4000),
  source_page: z.string().trim().max(300).optional()
});

const leadRadarConfigSchema = z.object({
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

function parsePriceCents(value: string) {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error("价格必须是数字，最多保留两位小数。");
  }

  const [whole, fraction = ""] = trimmed.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

function encodeFormErrorMessage(message: string) {
  return encodeURIComponent(message);
}

function getPostImageBucketName() {
  return process.env.SUPABASE_POSTS_BUCKET
    ?? process.env.NEXT_PUBLIC_SUPABASE_POSTS_BUCKET
    ?? "posts";
}

function getFeedbackUploadBucketName() {
  return process.env.SUPABASE_FEEDBACK_BUCKET
    ?? process.env.NEXT_PUBLIC_SUPABASE_FEEDBACK_BUCKET
    ?? getPostImageBucketName();
}

async function saveUploadedFeedbackAttachment(file: File) {
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

export async function requestProductAccess(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = productAccessSchema.safeParse({
    product_slug: getText(formData, "product_slug"),
    access_type: getText(formData, "access_type"),
    email: getText(formData, "email").toLowerCase(),
    company_name: getText(formData, "company_name") || undefined,
    role: getText(formData, "role") || undefined,
    source_page: getText(formData, "source_page") || undefined,
    use_case: getText(formData, "use_case") || undefined
  });

  if (!parsed.success) {
    return { success: false, message: "Please complete the access request with a valid email." };
  }

  const eventName = parsed.data.access_type === "monthly_subscription"
    ? "monthly_subscription_checkout_started"
    : parsed.data.access_type === "paid_pilot"
      ? "paid_pilot_requested"
      : parsed.data.access_type === "partner_preview"
        ? "partner_preview_requested"
        : "trial_access_requested";

  try {
    await addProductAccessRequest({
      product_slug: parsed.data.product_slug as ProductSlug,
      access_type: parsed.data.access_type as ProductAccessType,
      email: parsed.data.email,
      company_name: parsed.data.company_name,
      role: parsed.data.role,
      source_page: parsed.data.source_page,
      use_case: parsed.data.use_case
    });
    await saveSubscriber({
      email: parsed.data.email,
      source_page: parsed.data.source_page,
      source_type: "product_access",
      topic_tag: parsed.data.product_slug === "leadradar" ? "manufacturing_social_lead_discovery" : "workflow_signal_research",
      note: parsed.data.use_case
    });
    await trackTrialEvent({
      product_slug: parsed.data.product_slug as ProductSlug,
      event_type: eventName,
      email: parsed.data.email,
      source_page: parsed.data.source_page,
      metadata: {
        access_type: parsed.data.access_type,
        company_name: parsed.data.company_name,
        role: parsed.data.role
      }
    });
  } catch (error) {
    console.error("Failed to request product access:", error);
    return {
      success: false,
      message: "Access request could not be submitted just now. Please email soloclientlab.com@gmail.com."
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/product-access");
  revalidatePath("/admin/trials");
  revalidatePath("/admin/subscribers");

  return {
    success: true,
    message: parsed.data.access_type === "paid_pilot" || parsed.data.access_type === "monthly_subscription"
      ? "Your subscription request has been received."
      : parsed.data.access_type === "partner_preview"
        ? "Your partner preview request has been received. The evaluation window is arranged through the collaboration conversation."
        : "Your product access request has been received. We will follow up with the next subscription or setup step.",
    eventName
  };
}

export async function startMonthlySubscriptionCheckout(formData: FormData) {
  const requestedProductSlug: ProductSlug =
    getText(formData, "product_slug") === "needradar-workflow-lab" ? "needradar-workflow-lab" : "leadradar";
  const parsed = monthlySubscriptionCheckoutSchema.safeParse({
    product_slug: requestedProductSlug,
    source_page: getText(formData, "source_page") || undefined
  });

  if (!parsed.success) {
    redirect(`/checkout/cancel?reason=invalid_subscription_request&product=${encodeURIComponent(requestedProductSlug)}`);
  }

  const productSlug = parsed.data.product_slug as ProductSlug;
  const siteUrl = getSiteUrl();
  const metadata = {
    product_slug: productSlug,
    access_type: "monthly_subscription",
    source_page: parsed.data.source_page ?? ""
  };

  let checkoutUrl: string | null = null;

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: getProductMonthlySubscriptionPriceId(productSlug),
          quantity: 1
        }
      ],
      success_url: `${siteUrl}/checkout/success?provider=stripe&session_id={CHECKOUT_SESSION_ID}&product=${encodeURIComponent(productSlug)}`,
      cancel_url: `${siteUrl}/checkout/cancel?product=${encodeURIComponent(productSlug)}`,
      allow_promotion_codes: true,
      metadata,
      subscription_data: {
        metadata
      }
    });

    checkoutUrl = session.url;

    await trackTrialEvent({
      product_slug: productSlug,
      event_type: "monthly_subscription_checkout_started",
      source_page: parsed.data.source_page,
      metadata: {
        stripe_checkout_session_id: session.id,
        access_type: "monthly_subscription"
      }
    });
  } catch (error) {
    console.error("Failed to create monthly subscription checkout:", error);
    redirect(`/checkout/cancel?reason=subscription_checkout_failed&product=${encodeURIComponent(productSlug)}`);
  }

  if (!checkoutUrl) {
    redirect(`/checkout/cancel?reason=missing_checkout_url&product=${encodeURIComponent(productSlug)}`);
  }

  redirect(checkoutUrl);
}

export async function startPayPalCheckout(formData: FormData) {
  const requestedProductSlug = getText(formData, "product_slug").trim() as ProductSlug;
  const parsed = monthlySubscriptionCheckoutSchema.safeParse({
    product_slug: requestedProductSlug,
    source_page: getText(formData, "source_page") || undefined
  });

  if (!parsed.success) {
    redirect(`/checkout/cancel?reason=invalid_paypal_request&product=${encodeURIComponent(requestedProductSlug)}`);
  }

  const productSlug = parsed.data.product_slug as ProductSlug;
  const product = await getProductBySlug(productSlug);
  if (!product || !product.payment_enabled) {
    redirect(`/checkout/cancel?reason=product_not_available&product=${encodeURIComponent(productSlug)}`);
  }
  const checkoutId = randomUUID();
  let approveUrl: string | undefined;

  try {
    const order = await createPayPalProductOrder({
      checkoutId,
      productSlug,
      productName: product.name,
      amountCents: product.price_cents,
      currency: product.currency,
      returnUrl: `${getSiteUrl()}/api/payments/paypal/return`,
      cancelUrl: `${getSiteUrl()}/checkout/cancel?product=${encodeURIComponent(productSlug)}`
    });

    if (!order.approveUrl) {
      throw new Error("PayPal did not return an approval URL.");
    }
    approveUrl = order.approveUrl;

    await addPendingProductPayment({
      provider: "paypal",
      product_slug: productSlug,
      currency: product.currency,
      amount_subtotal: product.price_cents,
      amount_total: product.price_cents,
      provider_checkout_session_id: order.id,
      checkout_url: order.approveUrl,
      metadata: {
        access_type: "lifetime_access",
        product_name: product.name,
        source_page: parsed.data.source_page
      }
    });

    try {
      await trackTrialEvent({
        product_slug: productSlug,
        event_type: "paypal_access_started",
        source_page: parsed.data.source_page,
        metadata: {
          paypal_order_id: order.id,
          access_type: "lifetime_access"
        }
      });
    } catch (error) {
      console.error("PayPal checkout analytics write failed:", error);
    }
  } catch (error) {
    console.error("Failed to create PayPal checkout:", error);
    redirect(`/checkout/cancel?reason=paypal_checkout_failed&product=${encodeURIComponent(productSlug)}`);
  }

  if (!approveUrl) {
    redirect(`/checkout/cancel?reason=missing_paypal_approval_url&product=${encodeURIComponent(productSlug)}`);
  }

  redirect(approveUrl);
}

export async function createPaidPilotCheckout(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = paidPilotCheckoutSchema.safeParse({
    email: getText(formData, "email").toLowerCase(),
    company_name: getText(formData, "company_name"),
    role: getText(formData, "role") || undefined,
    use_case: getText(formData, "use_case"),
    source_page: getText(formData, "source_page") || undefined
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please add a valid email, company or workflow name, and paid pilot use case."
    };
  }

  let accessRequestId: string;
  let checkoutUrl: string;

  try {
    const product = await getProductBySlug("leadradar");
    if (!product || !product.payment_enabled) {
      throw new Error("LeadRadar product is not available for payment.");
    }
    const amountCents = product.price_cents;
    const currency = product.currency;

    accessRequestId = await addProductAccessRequest({
      product_slug: "leadradar",
      access_type: "paid_pilot",
      email: parsed.data.email,
      company_name: parsed.data.company_name,
      role: parsed.data.role,
      source_page: parsed.data.source_page,
      use_case: parsed.data.use_case
    });

    const paypalOrder = await createPayPalPaidPilotOrder({
      accessRequestId,
      returnUrl: `${getSiteUrl()}/api/payments/paypal/return`,
      cancelUrl: `${getSiteUrl()}/checkout/cancel?product=leadradar`
    });

    if (!paypalOrder.approveUrl) {
      throw new Error("PayPal did not return an approval URL.");
    }
    checkoutUrl = paypalOrder.approveUrl;

    await addPendingProductPayment({
      provider: "paypal",
      product_slug: "leadradar",
      access_request_id: accessRequestId,
      email: parsed.data.email,
      currency,
      amount_subtotal: amountCents,
      amount_total: amountCents,
      provider_checkout_session_id: paypalOrder.id,
      checkout_url: paypalOrder.approveUrl,
      metadata: {
        access_type: "paid_pilot",
        company_name: parsed.data.company_name,
        role: parsed.data.role,
        use_case: parsed.data.use_case,
        source_page: parsed.data.source_page
      }
    });

    const secondaryWrites = await Promise.allSettled([
      saveSubscriber({
        email: parsed.data.email,
        source_page: parsed.data.source_page,
        source_type: "product_access",
        topic_tag: "manufacturing_social_lead_discovery",
        note: parsed.data.use_case
      }),
      trackTrialEvent({
        product_slug: "leadradar",
        event_type: "paid_pilot_requested",
        email: parsed.data.email,
        source_page: parsed.data.source_page,
        metadata: {
          access_request_id: accessRequestId,
          paypal_order_id: paypalOrder.id,
          company_name: parsed.data.company_name
        }
      })
    ]);
    secondaryWrites.forEach((result) => {
      if (result.status === "rejected") {
        console.error("Paid pilot checkout secondary write failed:", result.reason);
      }
    });
  } catch (error) {
    console.error("Failed to create paid pilot checkout:", error);
    return {
      success: false,
      message: "Checkout could not be started just now. Please email soloclientlab.com@gmail.com."
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/product-access");

  return {
    success: true,
    message: "Redirecting to secure checkout...",
    redirectUrl: checkoutUrl,
    eventName: "paid_pilot_requested"
  };
}

export async function submitLeadRadarConfig(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = leadRadarConfigSchema.safeParse({
    email: getText(formData, "email").toLowerCase(),
    company_name: getText(formData, "company_name") || undefined,
    target_market: getText(formData, "target_market") || undefined,
    platforms: getText(formData, "platforms") || undefined,
    keywords: getText(formData, "keywords"),
    countries: getText(formData, "countries") || undefined,
    capabilities: getText(formData, "capabilities") || undefined,
    lead_types: getText(formData, "lead_types") || undefined,
    notes: getText(formData, "notes") || undefined,
    source_page: getText(formData, "source_page") || undefined
  });

  if (!parsed.success) {
    return { success: false, message: "Please add your email and at least one keyword or signal phrase." };
  }

  const keywords = parsed.data.keywords
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  if (!keywords.length) {
    return { success: false, message: "Please add at least one keyword or signal phrase." };
  }

  try {
    await addLeadRadarConfig({
      email: parsed.data.email,
      company_name: parsed.data.company_name,
      target_market: parsed.data.target_market,
      platforms: parsed.data.platforms,
      keywords,
      countries: parsed.data.countries,
      capabilities: parsed.data.capabilities,
      lead_types: parsed.data.lead_types,
      notes: parsed.data.notes
    });
    await trackTrialEvent({
      product_slug: "leadradar",
      event_type: "radar_config_completed",
      email: parsed.data.email,
      source_page: parsed.data.source_page,
      metadata: {
        keyword_count: keywords.length,
        company_name: parsed.data.company_name
      }
    });
    await trackTrialEvent({
      product_slug: "leadradar",
      event_type: "keywords_added",
      email: parsed.data.email,
      source_page: parsed.data.source_page,
      metadata: { keywords }
    });
  } catch (error) {
    console.error("Failed to submit LeadRadar config:", error);
    return {
      success: false,
      message: "Configuration could not be submitted just now. Please email soloclientlab.com@gmail.com."
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/leadradar-configs");

  return {
    success: true,
    message: "Your LeadRadar configuration has been received.",
    eventName: "radar_config_completed"
  };
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
  const postId = getText(formData, "id") || undefined;

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
      content: getText(formData, "content") || undefined,
      cover_image_url: getText(formData, "cover_image_url") || undefined,
      topic_tag: (getText(formData, "topic_tag") || undefined) as TopicTag | undefined,
      seo_title: getText(formData, "seo_title") || undefined,
      seo_description: getText(formData, "seo_description") || undefined,
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

export async function upsertProduct(formData: FormData) {
  await requireAdmin();

  const productId = getText(formData, "id") || undefined;
  const previousProduct = productId ? await getProductById(productId) : null;
  let productSlug = "";

  try {
    const product = {
      id: productId,
      name: getText(formData, "name").trim(),
      slug: getText(formData, "slug").trim(),
      short_description: getText(formData, "short_description") || undefined,
      hero_title: getText(formData, "hero_title") || undefined,
      hero_description: getText(formData, "hero_description") || undefined,
      audience: getText(formData, "audience") || undefined,
      problem: getText(formData, "problem") || undefined,
      promise: getText(formData, "promise") || undefined,
      delivery_mode: getText(formData, "delivery_mode") as ProductDeliveryMode,
      development_status: getText(formData, "development_status") as ProductDevelopmentStatus,
      price_cents: parsePriceCents(getText(formData, "price_amount")),
      currency: getText(formData, "currency").trim().toUpperCase(),
      payment_enabled: formData.get("payment_enabled") === "on",
      status: getText(formData, "status") as ProductStatus,
      seo_title: getText(formData, "seo_title") || undefined,
      seo_description: getText(formData, "seo_description") || undefined,
      published_at: getOptionalDateTime(formData, "published_at")
    };
    productSlug = product.slug;
    await saveProduct(product);
  } catch (error) {
    console.error("Failed to save product:", error);
    const fallbackMessage = "商品保存失败，请检查必填项后重试。";
    const message = error instanceof Error && error.message ? error.message : fallbackMessage;
    redirect(`/admin/products/${productId ?? "new"}?error=${encodeFormErrorMessage(message)}`);
  }

  revalidatePath("/products");
  if (previousProduct?.slug && previousProduct.slug !== productSlug) {
    revalidatePath(`/products/${previousProduct.slug}`);
  }
  revalidatePath(`/products/${productSlug}`);
  revalidatePath("/admin/products");
  if (productId) {
    revalidatePath(`/admin/products/${productId}`);
  }
  redirect("/admin/products");
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
