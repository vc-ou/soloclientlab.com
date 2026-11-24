import type { Metadata } from "next";
import { ProductsCatalog } from "@/components/products-catalog";
import { getPublicProducts } from "@/lib/domains/catalog";

export const metadata: Metadata = {
  title: {
    absolute: "Tools from the case files | SoloClientLab"
  },
  description: "Small tools that came out of scene fixes — built after the judgment, not before.",
  alternates: {
    canonical: "/products"
  }
};

export default async function ProductsPage() {
  const products = await getPublicProducts();
  return <ProductsCatalog products={products} />;
}
