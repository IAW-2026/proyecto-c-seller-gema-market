import Image from "next/image";
import { ProductGlyph } from "@/components/ui/product-glyph";
import { getProductVisual } from "@/lib/ui/ui-config";
import type { ProductWithJoins } from "@/types/domain";

// Thumbnail con fallback a la primera imagen de la galería si el thumbnail
// dedicado no está cargado. Si no hay ninguna imagen, renderiza el glyph de
// la categoría sobre un fondo con gradiente — mismo placeholder visual que
// aparecía hardcodeado en products-screen y stock-screen antes.

export type ProductThumbProps = {
  product: Pick<ProductWithJoins, "title" | "thumbnailUrl" | "images" | "categoryName">;
  className: string;
  glyphSize: number;
  imageSizes?: string;
};

export function ProductThumb({
  product,
  className,
  glyphSize,
  imageSizes = "60px",
}: ProductThumbProps) {
  const thumb = product.thumbnailUrl ?? product.images[0] ?? null;
  const visual = getProductVisual(product.categoryName);

  if (thumb) {
    return (
      <div className={`${className} relative overflow-hidden shrink-0`}>
        <Image
          src={thumb}
          alt={product.title}
          fill
          sizes={imageSizes}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center shrink-0`}
      style={{
        background: `linear-gradient(135deg, ${visual.palette[0]}55, ${visual.palette[1]}55)`,
      }}
    >
      <ProductGlyph kind={visual.glyph} palette={visual.palette} size={glyphSize} />
    </div>
  );
}
