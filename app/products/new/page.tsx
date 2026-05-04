import type { Metadata } from "next";
import { ProductEditScreen } from "@/components/screens/product-edit-screen";
import { getCurrentSeller } from "@/lib/current-seller";
import { CATEGORIES } from "@/lib/data/categories";
import { saveProductAction } from "@/app/products/actions";

export const metadata: Metadata = {
  title: "Nueva publicación",
};

export default async function NewProductPage() {
  const seller = await getCurrentSeller();
  return (
    <ProductEditScreen
      seller={seller}
      mode="new"
      product={null}
      categories={CATEGORIES}
      onSaveAction={saveProductAction}
    />
  );
}
