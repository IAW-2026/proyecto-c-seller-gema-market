import 'server-only';
import { prisma } from '@/lib/db';
import { newId, PREFIXES } from '@/lib/ids';
import type { Reserva, ReservaInput } from "@/types/domain";

// Módulo de reservas de stock.
//
// Consumidor: Payments App vía:
//   POST /api/seller/productos/:product_id/reservar       → createReserva
//   POST /api/seller/productos/:product_id/liberar-reserva → releaseReserva
//
// Flujo:
//   1. Payments App inicia checkout → llama createReserva para bloquear stock.
//   2a. Pago confirmado → la reserva se libera al registrar la venta.
//   2b. Pago no llega antes de expiresAt → Payments App llama releaseReserva.

export async function createReserva(input: ReservaInput): Promise<Reserva> {
  return prisma.reserva.create({
    data: { id: newId(PREFIXES.reserva), ...input },
  });
}

// Devuelve la cantidad de reservas borradas — el route handler usa esto
// para distinguir 200 (al menos una eliminada) de 404 (ninguna activa).
export async function releaseReserva(
  orderId: string,
  productId: string,
): Promise<number> {
  const result = await prisma.reserva.deleteMany({
    where: { orderId, productId },
  });
  return result.count;
}
