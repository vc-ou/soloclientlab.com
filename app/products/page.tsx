import type { Metadata } from "next";
import { ProductsCatalog } from "@/components/products-catalog";
import { getPublicProducts } from "@/lib/db";

export const metadata: Metadata = {
  title: {
    absolute: "Products | SoloClientLab"
  },
  description: "Tools built for solo clients and builders.",
  alternates: {
    canonical: "/products"
  }
};

export default async function ProductsPage() {
  const products = await getPublicProducts();
  return <ProductsCatalog products={products} />;
}
