import 'server-only';
import type { Reserva, ReservaInput } from "@/types/domain";

// Módulo de reservas de stock.
//
// Consumidor: Buyer App vía POST /api/reservas (autenticado con EXTERNAL_API_KEY).
// Flujo:
//   1. Buyer App inicia checkout → llama createReserva para bloquear stock.
//   2a. Pago confirmado → la reserva se libera automáticamente al registrar la venta.
//   2b. Pago no llega antes de expiresAt → Buyer App llama releaseReserva.

export async function createReserva(input: ReservaInput): Promise<Reserva> {
  // TODO: implementar con Prisma
  // await prisma.reserva.create({ data: { ...input, id: cuid() } })
  void input;
  throw new Error("createReserva: backend no implementado aún");
}

export async function releaseReserva(id: string): Promise<void> {
  // TODO: implementar con Prisma
  // await prisma.reserva.delete({ where: { id } })
  void id;
  throw new Error("releaseReserva: backend no implementado aún");
}
