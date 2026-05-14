// Smoke E2E. Una sola transacción de comprador "real": cataloga → reserva
// → paga → recibe envío. Atraviesa los 6 endpoints del flujo principal +
// el de abandono. Si este archivo rompe, algo en el contrato seller↔buyer/
// payments/shipping cambió.
//
// Por qué un solo `it()` largo en vez de varios chicos:
//   - El flujo ES la unidad de aserción ("la compra termina con la Sale en
//     delivered y tracking persistido"). Partirlo en varios `it()` crearía
//     dependencias entre tests, que es exactamente lo que NO queremos.
//   - Si algo rompe, la línea del fail apunta directo al paso del flujo.
//   - Los tests unitarios por endpoint (en los otros .test.ts) ya cubren
//     los edge cases. Acá solo nos importa el happy path encadenado.
//
// El abandono va en un segundo `it()` separado porque es un flujo alternativo
// con su propia historia (reservar → liberar → stock restaurado), no una
// continuación del primero.

import { describe, it, expect, beforeEach } from 'vitest';
import { GET as listProductos } from '@/app/api/seller/productos/route';
import { GET as getProducto } from '@/app/api/seller/productos/[product_id]/route';
import { POST as batchProductos } from '@/app/api/seller/productos/batch/route';
import { POST as reservar } from '@/app/api/seller/productos/[product_id]/reservar/route';
import { POST as liberarReserva } from '@/app/api/seller/productos/[product_id]/liberar-reserva/route';
import { POST as confirmarPago } from '@/app/api/seller/pagos/[payment_id]/confirmado/route';
import { POST as estadoEnvio } from '@/app/api/seller/ventas/[order_id]/estado-envio/route';
import { invokeGet, invokePost } from '@/tests/helpers/invoke';
import { authHeader } from '@/tests/helpers/auth';
import { resetMutableState } from '@/tests/helpers/seed-reset';
import { SEED_PRODUCT_STOCK, TEST_PRODUCT_IDS } from '@/tests/fixtures/seed';
import { prisma } from '@/lib/db';

describe('E2E smoke: ciclo de compra completo', () => {
  beforeEach(async () => {
    await resetMutableState();
  });

  it('happy path: catálogo → reserva → pago confirmado → envío → entrega', async () => {
    const productId = TEST_PRODUCT_IDS.sillon;
    const initialStock = SEED_PRODUCT_STOCK[productId]!;
    const orderId = 'ord-e2e-smoke-1';
    const paymentId = 'pay-e2e-smoke-1';
    const quantity = 2;
    const buyerId = 'buyer-e2e';
    const buyerName = 'Buyer E2E';

    // ── 1. Buyer App lista productos del catálogo ───────────────────────────
    const listRes = await invokeGet(listProductos, {
      url: 'http://test/api/seller/productos',
      headers: authHeader(),
    });
    expect(listRes.status).toBe(200);
    const listBody = (await listRes.json()) as {
      items: Array<{ product_id: string; stock?: number }>;
    };
    expect(listBody.items.some((p) => p.product_id === productId)).toBe(true);

    // ── 2. Buyer App ve el detalle del producto ─────────────────────────────
    const detailRes = await invokeGet(getProducto, {
      url: `http://test/api/seller/productos/${productId}`,
      headers: authHeader(),
      params: { product_id: productId },
    });
    expect(detailRes.status).toBe(200);
    const detail = (await detailRes.json()) as {
      product_id: string;
      stock: number;
      seller: { seller_id: string };
    };
    expect(detail.product_id).toBe(productId);
    expect(detail.stock).toBe(initialStock);

    // ── 3. Buyer App resuelve el carrito vía batch ──────────────────────────
    const batchRes = await invokePost(batchProductos, {
      url: 'http://test/api/seller/productos/batch',
      headers: authHeader(),
      body: { product_ids: [productId] },
    });
    expect(batchRes.status).toBe(200);
    const batchBody = (await batchRes.json()) as {
      products: Array<{ product_id: string; stock: number }>;
    };
    expect(batchBody.products).toHaveLength(1);
    expect(batchBody.products[0]!.stock).toBe(initialStock);

    // ── 4. Payments App reserva el stock al iniciar checkout ────────────────
    const reservarRes = await invokePost(reservar, {
      url: `http://test/api/seller/productos/${productId}/reservar`,
      headers: authHeader(),
      body: { order_id: orderId, buyer_id: buyerId, buyer_name: buyerName, quantity },
      params: { product_id: productId },
    });
    expect(reservarRes.status).toBe(200);
    expect(await reservarRes.json()).toEqual({ ok: true });

    // El stock visible al resto de buyers refleja el descuento.
    const detailAfterReserveRes = await invokeGet(getProducto, {
      url: `http://test/api/seller/productos/${productId}`,
      headers: authHeader(),
      params: { product_id: productId },
    });
    const detailAfterReserve = (await detailAfterReserveRes.json()) as { stock: number };
    expect(detailAfterReserve.stock).toBe(initialStock - quantity);

    // La Reserva existe en DB con expiresAt en el futuro.
    const reserva = await prisma.reserva.findFirst({
      where: { orderId, productId },
    });
    expect(reserva).not.toBeNull();
    expect(reserva!.quantity).toBe(quantity);
    expect(reserva!.buyerId).toBe(buyerId);
    expect(reserva!.expiresAt.getTime()).toBeGreaterThan(Date.now());

    // ── 5. Payments App confirma el pago ────────────────────────────────────
    const confirmRes = await invokePost(confirmarPago, {
      url: `http://test/api/seller/pagos/${paymentId}/confirmado`,
      headers: authHeader(),
      body: {
        payment_id: paymentId,
        orders: [{
          order_id: orderId,
          product_id: productId,
          quote_id: 'qte-e2e',
          amount: 89000,
          fee: 5340,
          currency: 'ARS',
          paid_at: '2026-05-13T12:00:00Z',
        }],
      },
      params: { payment_id: paymentId },
    });
    expect(confirmRes.status).toBe(200);
    expect(await confirmRes.json()).toEqual({ ok: true });

    // Reserva borrada, Sale creada con datos de la Reserva + del pago.
    expect(await prisma.reserva.findFirst({ where: { orderId } })).toBeNull();
    const sale = await prisma.sale.findFirst({ where: { orderId, productId } });
    expect(sale).not.toBeNull();
    expect(sale!.buyerId).toBe(buyerId);
    expect(sale!.buyerName).toBe(buyerName);
    expect(sale!.amount).toBe(quantity);
    expect(sale!.paymentId).toBe(paymentId);
    expect(sale!.status).toBe('paid');
    expect(sale!.trackingCode).toBeNull();
    expect(sale!.sellerId).toBe(detail.seller.seller_id);

    // Confirmar el pago NO toca stock: ya quedó descontado al reservar.
    const detailAfterPayRes = await invokeGet(getProducto, {
      url: `http://test/api/seller/productos/${productId}`,
      headers: authHeader(),
      params: { product_id: productId },
    });
    const detailAfterPay = (await detailAfterPayRes.json()) as { stock: number };
    expect(detailAfterPay.stock).toBe(initialStock - quantity);

    // ── 6. Shipping App reporta que el paquete está en tránsito ─────────────
    const shippingRes = await invokePost(estadoEnvio, {
      url: `http://test/api/seller/ventas/${orderId}/estado-envio`,
      headers: authHeader(),
      body: {
        order_id: orderId,
        status: 'in_transit',
        tracking_code: 'BB-E2E-001',
        updated_at: '2026-05-13T15:00:00Z',
      },
      params: { order_id: orderId },
    });
    expect(shippingRes.status).toBe(200);

    const saleInTransit = await prisma.sale.findFirst({ where: { orderId } });
    expect(saleInTransit!.status).toBe('shipping');
    expect(saleInTransit!.trackingCode).toBe('BB-E2E-001');

    // ── 7. Shipping App reporta entrega ─────────────────────────────────────
    const deliveredRes = await invokePost(estadoEnvio, {
      url: `http://test/api/seller/ventas/${orderId}/estado-envio`,
      headers: authHeader(),
      body: {
        order_id: orderId,
        status: 'delivered',
        tracking_code: 'BB-E2E-001',
        updated_at: '2026-05-13T20:00:00Z',
      },
      params: { order_id: orderId },
    });
    expect(deliveredRes.status).toBe(200);

    const saleDelivered = await prisma.sale.findFirst({ where: { orderId } });
    expect(saleDelivered!.status).toBe('delivered');
    expect(saleDelivered!.trackingCode).toBe('BB-E2E-001');
  });

  it('flujo alternativo: checkout abandonado → reserva liberada → stock restaurado', async () => {
    const productId = TEST_PRODUCT_IDS.pava;
    const initialStock = SEED_PRODUCT_STOCK[productId]!;
    const orderId = 'ord-e2e-abandon-1';
    const quantity = 1;

    // 1. Reservar.
    const reservarRes = await invokePost(reservar, {
      url: `http://test/api/seller/productos/${productId}/reservar`,
      headers: authHeader(),
      body: {
        order_id: orderId,
        buyer_id: 'buyer-abandon',
        buyer_name: 'Abandonador',
        quantity,
      },
      params: { product_id: productId },
    });
    expect(reservarRes.status).toBe(200);

    // Stock descontado, Reserva creada.
    let product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });
    expect(product!.stock).toBe(initialStock - quantity);
    expect(await prisma.reserva.findFirst({ where: { orderId } })).not.toBeNull();

    // 2. Buyer abandona → Payments libera la reserva.
    const liberarRes = await invokePost(liberarReserva, {
      url: `http://test/api/seller/productos/${productId}/liberar-reserva`,
      headers: authHeader(),
      body: { order_id: orderId },
      params: { product_id: productId },
    });
    expect(liberarRes.status).toBe(200);

    // Stock restaurado al valor inicial, Reserva borrada, no se creó Sale.
    product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });
    expect(product!.stock).toBe(initialStock);
    expect(await prisma.reserva.findFirst({ where: { orderId } })).toBeNull();
    expect(await prisma.sale.findFirst({ where: { orderId } })).toBeNull();
  });
});
