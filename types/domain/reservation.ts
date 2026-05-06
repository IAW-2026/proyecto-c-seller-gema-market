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
  expiresAt: Date;   // definido por el Buyer App
  createdAt: Date;
};

export type ReservaInput = {
  productId: string;
  orderId: string;
  buyerId: string;
  quantity: number;
  expiresAt: Date;
};
