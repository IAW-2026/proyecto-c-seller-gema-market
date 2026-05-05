import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductEditScreen } from "@/components/screens/product-edit-screen";
import { getCurrentSeller } from "@/lib/auth/current-seller";
import { CATEGORIES } from "@/lib/data/categories";
import { saveProductAction } from "@/app/products/actions";

export const metadata: Metadata = {
  title: "Nueva publicación",
};

export default function NewProductPage() {
  return (
    <Suspense>
      <NewProductContent />
    </Suspense>
  );
}

async function NewProductContent() {
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
