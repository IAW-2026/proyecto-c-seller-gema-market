import 'server-only';
import { prisma } from '@/lib/db';
import { newId, PREFIXES } from '@/lib/ids';
import type { Reserva } from '@/types/domain';

// Módulo de reservas de stock.
//
// Consumidor: Payments App vía:
//   POST /api/seller/productos/:product_id/reservar       → createReserva
//   POST /api/seller/productos/:product_id/liberar-reserva → releaseReserva
//
// Flujo:
//   1. Payments App inicia checkout → llama createReserva, que en una sola
//      transacción decrementa Product.stock y crea la fila en Reserva.
//   2a. Pago confirmado → /confirmado lee la Reserva, crea la Sale, y borra
//       la Reserva (sin tocar stock — ya quedó descontado en el paso 1).
//   2b. Pago no llega o el comprador abandona → Payments App llama
//       releaseReserva, que en una transacción restaura el stock y borra
//       la Reserva.
//
// Cleanup de Reservas vencidas: dos mecanismos complementarios.
//   - Cron diario (Vercel Cron, plan Hobby = 1 vez/día) → sweepExpiredReservas
//     barre TODAS las expiradas globalmente. Safety net para productos que
//     nadie está intentando comprar.
//   - Lazy sweep dentro de createReserva → si alguien intenta reservar un
//     producto, barre las expiradas DE ESE PRODUCTO antes de procesar. Cubre
//     el gap entre corridas del cron: el caso real ("compré algo que otra
//     persona había reservado y abandonó hace media hora") se resuelve sin
//     esperar al 3am.
//
// `expiresAt` lo asigna esta capa (no lo envía el cliente) usando la env var
// RESERVATION_TTL_MINUTES (default 30). El consumer no se entera del TTL.

const DEFAULT_RESERVATION_TTL_MINUTES = 30;

function reservationTtlMinutes(): number {
  const raw = process.env.RESERVATION_TTL_MINUTES;
  if (!raw) return DEFAULT_RESERVATION_TTL_MINUTES;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_RESERVATION_TTL_MINUTES;
}

function reservationExpiresAt(): Date {
  return new Date(Date.now() + reservationTtlMinutes() * 60_000);
}

export type CreateReservaInput = {
  orderId: string;
  productId: string;
  buyerId: string;
  buyerName: string;
  quantity: number;
};

// Discriminated union: el handler matchea sobre `outcome` y mapea a HTTP.
// Mantiene los errores de negocio separados de las excepciones técnicas
// (DB caída, etc.) — esas siguen siendo throws.
export type CreateReservaResult =
  | { outcome: 'created'; reserva: Reserva }
  | { outcome: 'product_not_found' }
  | { outcome: 'insufficient_stock' }
  | { outcome: 'order_already_reserved' }
  | { outcome: 'order_already_sold' };

export async function createReserva(
  input: CreateReservaInput,
): Promise<CreateReservaResult> {
  return prisma.$transaction(async (tx) => {
    // 1. Lazy sweep de Reservas vencidas de ESTE producto. Cubre el gap entre
    // corridas del cron diario: si hay stock "fantasma" bloqueado por
    // Reservas expiradas, lo liberamos justo cuando alguien quiere comprar.
    //
    // Uso `DELETE ... RETURNING` vía $queryRaw para que sea atómico bajo
    // concurrencia: si dos /reservar corren en paralelo sobre el mismo
    // producto, Postgres garantiza que solo una transacción "gana" cada
    // Reserva expirada (el RETURNING de la otra devuelve array vacío),
    // así que no podemos sobre-restaurar stock por double-counting.
    const swept = await tx.$queryRaw<Array<{ quantity: number | bigint }>>`
      DELETE FROM "Reserva"
      WHERE "productId" = ${input.productId} AND "expiresAt" < NOW()
      RETURNING quantity
    `;
    if (swept.length > 0) {
      const restoreQty = swept.reduce((sum, r) => sum + Number(r.quantity), 0);
      await tx.product.update({
        where: { id: input.productId },
        data: { stock: { increment: restoreQty } },
      });
    }

    // 2. Order ya reservado por otro request? (idempotencia: Payments puede
    // reintentar con el mismo orderId — devolvemos 409 en vez de duplicar.)
    const existingReserva = await tx.reserva.findFirst({
      where: { orderId: input.orderId },
      select: { id: true },
    });
    if (existingReserva) return { outcome: 'order_already_reserved' as const };

    // 3. Order ya tiene Sale? La compra ya se concretó, no se puede re-reservar.
    const existingSale = await tx.sale.findFirst({
      where: { orderId: input.orderId },
      select: { id: true },
    });
    if (existingSale) return { outcome: 'order_already_sold' as const };

    // 4. Decremento atómico: updateMany con filtro de stock evita la race
    // condition de dos checkouts compitiendo por el último unit. Si el
    // producto no existe / está paused / soft-deleted / no tiene stock,
    // count será 0 y diferenciamos los casos con un find adicional.
    const decremented = await tx.product.updateMany({
      where: {
        id: input.productId,
        status: 'active',
        deletedAt: null,
        stock: { gte: input.quantity },
      },
      data: { stock: { decrement: input.quantity } },
    });

    if (decremented.count === 0) {
      const product = await tx.product.findFirst({
        where: { id: input.productId, status: 'active', deletedAt: null },
        select: { stock: true },
      });
      return product
        ? { outcome: 'insufficient_stock' as const }
        : { outcome: 'product_not_found' as const };
    }

    // 5. Crear Reserva. expiresAt lo computa esta capa (TTL desde env).
    const reserva = await tx.reserva.create({
      data: {
        id: newId(PREFIXES.reserva),
        orderId: input.orderId,
        productId: input.productId,
        buyerId: input.buyerId,
        buyerName: input.buyerName,
        quantity: input.quantity,
        expiresAt: reservationExpiresAt(),
      },
    });

    return { outcome: 'created' as const, reserva };
  });
}

export type SweepExpiredReservasResult = {
  sweptCount: number;
  // IDs de las reservas que se barrieron — útil para logs/observabilidad.
  sweptReservaIds: string[];
};

// Barre todas las Reservas con `expiresAt < now`, restaurando stock al producto
// correspondiente. Se invoca desde el endpoint `/api/internal/sweep-reservas`
// configurado como cron de Vercel.
//
// Atómico: en una sola transacción, agrupa increments por producto (un update
// por producto en vez de uno por reserva), borra todas las Reservas expiradas
// y devuelve la lista de IDs barridas.
//
// Race condition con `/liberar-reserva`: si Payments libera la misma Reserva
// al mismo tiempo, una de las dos transacciones gana (la primera commit). La
// otra encontrará 0 rows al hacer `deleteMany` y será un no-op.
export async function sweepExpiredReservas(): Promise<SweepExpiredReservasResult> {
  return prisma.$transaction(async (tx) => {
    const expired = await tx.reserva.findMany({
      where: { expiresAt: { lt: new Date() } },
      select: { id: true, productId: true, quantity: true },
    });
    if (expired.length === 0) {
      return { sweptCount: 0, sweptReservaIds: [] };
    }

    // Agrupar quantities por producto para emitir 1 update por producto, no
    // 1 por reserva. Si 3 reservas del mismo producto expiran al mismo tiempo,
    // un solo `increment` con la suma es más eficiente y menos disputado.
    const stockByProduct = new Map<string, number>();
    for (const r of expired) {
      stockByProduct.set(r.productId, (stockByProduct.get(r.productId) ?? 0) + r.quantity);
    }

    for (const [productId, increment] of stockByProduct) {
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment } },
      });
    }

    const sweptReservaIds = expired.map((r) => r.id);
    await tx.reserva.deleteMany({ where: { id: { in: sweptReservaIds } } });

    return { sweptCount: expired.length, sweptReservaIds };
  });
}

export type ReleaseReservaResult =
  | { outcome: 'released' }
  | { outcome: 'not_found' };

// Restaura stock + borra la Reserva en una transacción. El `productId` viene
// del path del endpoint y se valida que matchee la Reserva (defensa contra
// requests mal armados).
export async function releaseReserva(
  orderId: string,
  productId: string,
): Promise<ReleaseReservaResult> {
  return prisma.$transaction(async (tx) => {
    const reserva = await tx.reserva.findFirst({
      where: { orderId, productId },
    });
    if (!reserva) return { outcome: 'not_found' as const };

    await tx.product.update({
      where: { id: reserva.productId },
      data: { stock: { increment: reserva.quantity } },
    });
    await tx.reserva.delete({ where: { id: reserva.id } });

    return { outcome: 'released' as const };
  });
}
