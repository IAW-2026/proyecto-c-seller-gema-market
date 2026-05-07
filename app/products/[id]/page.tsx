import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductEditScreen } from "@/components/screens/product-edit-screen";
import { ProductEditSkeleton } from "@/components/screens/skeletons/product-edit-skeleton";
import { getCategories } from "@/lib/data/categories";
import { findProduct } from "@/lib/data/products";
import { saveProductAction } from "@/app/products/actions";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await findProduct(id);
  return {
    title: product ? `Editar — ${product.title}` : "Producto no encontrado",
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <Suspense fallback={<ProductEditSkeleton mode="edit" />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: ProductPageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    findProduct(id),
    getCategories(),
  ]);
  if (!product) {
    notFound();
  }
  return (
    <ProductEditScreen
      mode="edit"
      product={product}
      categories={categories}
      onSaveAction={saveProductAction}
    />
  );
}
