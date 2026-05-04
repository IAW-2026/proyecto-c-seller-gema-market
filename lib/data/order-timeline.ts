export const ORDER_TIMELINE = [
  "Pago",
  "Preparación",
  "Despacho",
  "Entrega",
] as const;

export type OrderTimelineStep = (typeof ORDER_TIMELINE)[number];
