import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductEditScreen } from "@/components/screens/product-edit-screen";
import { ProductEditSkeleton } from "@/components/screens/skeletons/product-edit-skeleton";
import { getCategories } from "@/lib/data/categories";
import { saveProductAction } from "@/app/products/actions";

export const metadata: Metadata = {
  title: "Nueva publicación",
};

export default function NewProductPage() {
  return (
    <Suspense fallback={<ProductEditSkeleton mode="new" />}>
      <NewProductContent />
    </Suspense>
  );
}

async function NewProductContent() {
  const categories = await getCategories();
  return (
    <ProductEditScreen
      mode="new"
      product={null}
      categories={categories}
      onSaveAction={saveProductAction}
    />
  );
}
