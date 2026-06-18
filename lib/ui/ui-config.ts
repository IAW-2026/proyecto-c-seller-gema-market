import type {
  OrderStatus,
  ProductStatus,
} from "@/types/domain";
import type { GlyphKind, Palette, StatusMeta } from "@/types/ui";

export type ProductVisual = {
  glyph: GlyphKind;
  palette: Palette;
};

const DEFAULT_PRODUCT_VISUAL: ProductVisual = {
  glyph: "box",
  palette: ["#a4ac86", "#414833"],
};

// Mapeo por nombre de categoría tal como está en `Categoria.name` (DB).
const PRODUCT_VISUALS_BY_CATEGORY_NAME: Readonly<Record<string, ProductVisual>> = {
  Living:     { glyph: "living",     palette: ["#a4ac86", "#414833"] },
  Dormitorio: { glyph: "dormitorio", palette: ["#936639", "#582f0e"] },
  Comedor:    { glyph: "comedor",    palette: ["#7f4f24", "#582f0e"] },
  Cocina:     { glyph: "cocina",     palette: ["#a68a64", "#414833"] },
  Baño:       { glyph: "bath",       palette: ["#a4ac86", "#333d29"] },
  Terraza:    { glyph: "terraza",    palette: ["#656d4a", "#a68a64"] },
  Decoración: { glyph: "decoracion", palette: ["#b6ad90", "#7f4f24"] },
};

export function getProductVisual(categoryName: string | null | undefined): ProductVisual {
  if (!categoryName) return DEFAULT_PRODUCT_VISUAL;
  return PRODUCT_VISUALS_BY_CATEGORY_NAME[categoryName] ?? DEFAULT_PRODUCT_VISUAL;
}

export const ORDER_STATUS_META: Readonly<Record<OrderStatus, StatusMeta>> = {
  paid:            { label: "Preparando",    tone: "sand" },
  shipping:        { label: "En camino",     tone: "forest" },
  delivered:       { label: "Entregado",     tone: "success" },
  shipping_failed: { label: "Error en envío", tone: "danger" },
};

export type ProductStatusOption = {
  id: ProductStatus;
  label: string;
  body: string;
};

export const PRODUCT_STATUS_OPTIONS: ReadonlyArray<ProductStatusOption> = [
  { id: "active", label: "Activa", body: "Visible en el catálogo" },
  { id: "paused", label: "Pausada", body: "Oculta temporalmente" },
];

// Pasos visibles del timeline de un pedido. Cada paso corresponde 1:1
// a un valor del enum OrderStatus en la DB.
// `external: true` indica que la transición a ese estado la dispara
// otra app (Shipping), no el seller.
export type OrderTimelineStep = {
  status: Extract<OrderStatus, "paid" | "shipping" | "delivered">;
  label: string;
  external?: boolean;
};

export const ORDER_TIMELINE: ReadonlyArray<OrderTimelineStep> = [
  { status: "paid",      label: "Preparación" },
  { status: "shipping",  label: "Despacho" },
  { status: "delivered", label: "Entrega", external: true },
];

export function getOrderTimelineIndex(status: OrderStatus): number {
  const idx = ORDER_TIMELINE.findIndex((s) => s.status === status);
  return idx === -1 ? 0 : idx;
}
