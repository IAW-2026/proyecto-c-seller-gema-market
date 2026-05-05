import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductEditScreen } from "@/components/screens/product-edit-screen";
import { CATEGORIES } from "@/lib/data/categories";
import { findProduct } from "@/lib/data/products";
import { saveProductAction } from "@/app/products/actions";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = findProduct(id);
  return {
    title: product ? `Editar — ${product.title}` : "Producto no encontrado",
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <Suspense>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: ProductPageProps) {
  const { id } = await params;
  const product = findProduct(id);
  if (!product) {
    notFound();
  }
  return (
    <ProductEditScreen
      mode="edit"
      product={product}
      categories={CATEGORIES}
      onSaveAction={saveProductAction}
    />
  );
}
