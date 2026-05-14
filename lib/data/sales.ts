import 'server-only';
import { prisma } from '@/lib/db';
import { newId, PREFIXES } from '@/lib/ids';
import type { OrderStatus } from '@/types/domain';

// Capa de datos para la tabla `Sale`.
//
// Consumidor: Payments App vía
//   POST /api/seller/pagos/:payment_id/confirmado → confirmPaymentSales
//
// Flujo: cuando Payments confirma el pago, cada item en `orders[]` debe tener
// una Reserva previa (creada por POST /reservar). Para cada uno:
//   1. Leer la Reserva por (orderId, productId) — `buyer_id`, `buyer_name` y
//      `quantity` salen de ahí, no del request.
//   2. Crear la fila en `Sale` con esos datos + lo que viene del request
//      (paymentId, total, fee).
//   3. Borrar la Reserva — el stock ya quedó descontado al reservar; confirmar
//      el pago no lo vuelve a tocar.
//
// Semántica all-or-nothing: si UNA sola Reserva falta, ninguna Sale se crea
// y ninguna Reserva se borra. Se implementa en dos fases dentro de una sola
// `$transaction`: primero un pase read-only para validar + resolver sellerId
// (fail-fast con discriminated union), después un pase write con los datos
// ya resueltos. Si la fase 1 retorna `reserva_not_found`, la fase 2 nunca
// corre y la tx commitea vacía.

export type ConfirmPaymentOrder = {
  orderId: string;
  productId: string;
  total: number; // body.amount del request → Sale.total
  fee: number;
};

export type ConfirmPaymentInput = {
  paymentId: string;
  orders: ConfirmPaymentOrder[];
};

export type ConfirmPaymentResult =
  | { outcome: 'confirmed'; saleIds: string[] }
  | { outcome: 'reserva_not_found'; orderId: string; productId: string };

export async function confirmPaymentSales(
  input: ConfirmPaymentInput,
): Promise<ConfirmPaymentResult> {
  return prisma.$transaction(async (tx) => {
    // Fase 1 — read-only: validar que existe Reserva para cada (orderId, productId)
    // y resolver los datos derivados que necesitamos para crear la Sale.
    const resolved: Array<{
      reservaId: string;
      orderId: string;
      productId: string;
      sellerId: string;
      buyerId: string;
      buyerName: string;
      quantity: number;
      total: number;
      fee: number;
    }> = [];

    for (const order of input.orders) {
      const reserva = await tx.reserva.findFirst({
        where: { orderId: order.orderId, productId: order.productId },
        select: {
          id: true,
          buyerId: true,
          buyerName: true,
          quantity: true,
          product: { select: { sellerId: true } },
        },
      });
      if (!reserva) {
        return {
          outcome: 'reserva_not_found' as const,
          orderId: order.orderId,
          productId: order.productId,
        };
      }
      resolved.push({
        reservaId: reserva.id,
        orderId: order.orderId,
        productId: order.productId,
        sellerId: reserva.product.sellerId,
        buyerId: reserva.buyerId,
        buyerName: reserva.buyerName,
        quantity: reserva.quantity,
        total: order.total,
        fee: order.fee,
      });
    }

    // Fase 2 — writes: crear las Sales y borrar las Reservas. Si llegamos acá,
    // todas las Reservas existen y los datos están resueltos.
    const saleIds: string[] = [];
    for (const r of resolved) {
      const sale = await tx.sale.create({
        data: {
          id: newId(PREFIXES.sale),
          orderId: r.orderId,
          productId: r.productId,
          sellerId: r.sellerId,
          buyerId: r.buyerId,
          buyerName: r.buyerName,
          paymentId: input.paymentId,
          amount: r.quantity,
          total: r.total,
          fee: r.fee,
        },
        select: { id: true },
      });
      saleIds.push(sale.id);
    }

    await tx.reserva.deleteMany({
      where: { id: { in: resolved.map((r) => r.reservaId) } },
    });

    return { outcome: 'confirmed' as const, saleIds };
  });
}

// Actualiza la Sale de un order con el estado de envío que reporta Shipping App
// y persiste el tracking_code. Una orden corresponde a un único producto (y
// por lo tanto a una sola Sale), así que `updateMany` por `orderId` opera sobre
// 0 o 1 row. Si `count === 0` significa que no hay Sale → 404.
//
// `status` llega ya mapeado al enum interno (`shipping`/`delivered`/`shipping_failed`);
// la traducción desde el vocabulario externo de Shipping App la hace el handler.
export type UpdateSaleShippingInput = {
  orderId: string;
  status: OrderStatus;
  trackingCode: string;
};

export type UpdateSaleShippingResult =
  | { outcome: 'updated' }
  | { outcome: 'not_found' };

export async function updateSaleShipping(
  input: UpdateSaleShippingInput,
): Promise<UpdateSaleShippingResult> {
  const result = await prisma.sale.updateMany({
    where: { orderId: input.orderId },
    data: { status: input.status, trackingCode: input.trackingCode },
  });
  if (result.count === 0) return { outcome: 'not_found' };
  return { outcome: 'updated' };
}
