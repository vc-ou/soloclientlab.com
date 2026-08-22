import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPage } from "@/components/product-page";
import { getProductBySlug } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const product = await getProductBySlug("leadradar");
  if (!product) {
    return { title: "LeadRadar" };
  }

  return {
    title: {
      absolute: `${product.name} | SoloClientLab`
    },
    description: product.seo_description ?? product.hero_description ?? product.short_description ?? undefined,
    alternates: {
      canonical: `/products/${product.slug}`
    }
  };
}

export default async function LeadRadarPage() {
  const product = await getProductBySlug("leadradar");
  if (!product) {
    notFound();
  }

  return <ProductPage product={product} />;
}
