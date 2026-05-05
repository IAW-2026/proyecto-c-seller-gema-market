// ─── Reserva ─────────────────────────────────────────────────────────────────
//
// Una reserva bloquea stock temporalmente durante el checkout del Buyer App.
// El Buyer App crea la reserva al iniciar el pago y la libera si:
//   - el pago se confirma (la reserva se convierte en venta), o
//   - expiresAt se alcanza sin pago (release explícito).

export type Reserva = {
  id: string;
  productId: string; // FK → producto.id
  orderId: string;   // FK lógica → Buyer App
  buyerId: string;   // FK lógica → Buyer App
  quantity: number;
  expiresAt: string; // ISO 8601 — definido por el Buyer App
  createdAt: string; // ISO 8601
};

export type ReservaInput = {
  productId: string;
  orderId: string;
  buyerId: string;
  quantity: number;
  expiresAt: string; // ISO 8601
};
