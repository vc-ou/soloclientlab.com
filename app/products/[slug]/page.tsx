import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPage } from "@/components/product-page";
import { getProductBySlug, getPublicProducts } from "@/lib/db";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "商品未找到"
    };
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

export async function generateStaticParams() {
  const products = await getPublicProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductPage product={product} />;
}
