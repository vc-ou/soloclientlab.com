"use server";

/**
 * 后台商品：新建编辑 / 同步 / 删除
 * 从 lib/actions.ts 拆分（S5）。编排层：可以依赖多个域，但不得写 SQL。
 */
import { encodeFormErrorMessage, getOptionalDateTime, getText, parseLandingPageUrl, parsePriceCents, parseProductFeatures } from "./shared";

import { deleteProductById, getProductById, saveProduct, syncSeedProducts } from "@/lib/domains/catalog";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type {
  ActionState,
  ProductDeliveryMode,
  ProductDevelopmentStatus,
  ProductStatus
} from "@/lib/types";

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
      landing_page_url: parseLandingPageUrl(getText(formData, "landing_page_url")),
      features: parseProductFeatures(getText(formData, "features")),
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


export async function syncCodeProducts() {
  await requireAdmin();

  let result: Awaited<ReturnType<typeof syncSeedProducts>>;
  try {
    result = await syncSeedProducts();
  } catch (error) {
    console.error("Failed to sync code products:", error);
    const message = error instanceof Error && error.message ? error.message : "代码商品同步失败，请稍后重试。";
    redirect(`/admin/products?sync=error&message=${encodeURIComponent(message)}`);
  }

  revalidatePath("/products");
  revalidatePath("/admin/products");
  redirect(`/admin/products?sync=success&inserted=${result.inserted}&updated=${result.updated}&total=${result.total}`);
}


export async function removeProduct(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const id = getText(formData, "id");
  if (!id) {
    return { success: false, message: "商品 id 不能为空。" };
  }

  const product = await getProductById(id);
  if (!product) {
    return { success: false, message: "商品不存在，可能已经被删除。" };
  }

  try {
    await deleteProductById(id);
  } catch (error) {
    console.error("Failed to delete product:", error);
    return { success: false, message: "商品删除失败，请稍后重试。" };
  }

  revalidatePath("/products");
  revalidatePath(`/products/${product.slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  return { success: true, message: "商品已删除。" };
}

