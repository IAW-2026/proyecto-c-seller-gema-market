import type { OrderStatus, ProductStatus, StatusMeta } from "@/types/domain";

export const ORDER_STATUS_META: Readonly<Record<OrderStatus, StatusMeta>> = {
  pago_pendiente: { label: "Pago pendiente", tone: "warn" },
  preparando: { label: "Preparando", tone: "sand" },
  listo_envio: { label: "Listo para envío", tone: "sage" },
  en_camino: { label: "En camino", tone: "forest" },
  entregado: { label: "Entregado", tone: "success" },
  cancelado: { label: "Cancelado", tone: "danger" },
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
