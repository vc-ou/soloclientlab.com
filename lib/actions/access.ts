"use server";

/**
 * 产品访问申请与 LeadRadar 配置问卷
 * 从 lib/actions.ts 拆分（S5）。编排层：可以依赖多个域，但不得写 SQL。
 */
import { getText, leadRadarConfigSchema, productAccessSchema } from "./shared";

import { addLeadRadarConfig, addProductAccessRequest, saveSubscriber } from "@/lib/domains/leads";
import { trackTrialEvent } from "@/lib/domains/analytics";
import { revalidatePath } from "next/cache";
import type {
  ActionState,
  ProductAccessType,
  ProductSlug
} from "@/lib/types";

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

