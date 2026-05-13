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
  buyerName: string; // denormalizado de Buyer App al momento de reservar
  quantity: number;
  expiresAt: Date;   // lo asigna la Seller App al crear la reserva (TTL fijo)
  createdAt: Date;
};
