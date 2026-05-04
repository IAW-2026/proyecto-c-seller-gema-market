import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductEditScreen } from "@/components/screens/product-edit-screen";
import { getCurrentSeller } from "@/lib/current-seller";
import { CATEGORIES } from "@/lib/data/categories";
import { findProduct, getProductStaticParams } from "@/lib/data/products";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

// Datos mock con set finito → cualquier id fuera del set debe 404 sin
// intentar renderizar. Cuando los productos vengan del backend, cambiar a
// `true` (default) y dejar que `notFound()` maneje los ids inexistentes.
export const dynamicParams = false;

export function generateStaticParams() {
  return getProductStaticParams();
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = findProduct(id);
  return {
    title: product ? `Editar — ${product.title}` : "Producto no encontrado",
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = findProduct(id);
  if (!product) {
    notFound();
  }
  const seller = await getCurrentSeller();
  return (
    <ProductEditScreen
      seller={seller}
      mode="edit"
      product={product}
      categories={CATEGORIES}
    />
  );
}
