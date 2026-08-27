import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPage } from "@/components/product-page";
import { getProductBySlug } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const product = await getProductBySlug("needradar-workflow-lab");
  if (!product) {
    return { title: "NeedRadar Workflow Lab" };
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

export default async function NeedRadarWorkflowLabPage() {
  const product = await getProductBySlug("needradar-workflow-lab");
  if (!product) {
    notFound();
  }

  return <ProductPage product={product} />;
}
