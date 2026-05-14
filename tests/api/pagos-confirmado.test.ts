import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/seller/pagos/[payment_id]/confirmado/route';
import { invokePost } from '@/tests/helpers/invoke';
import { authHeader } from '@/tests/helpers/auth';
import { resetMutableState } from '@/tests/helpers/seed-reset';
import {
  SEED_PRODUCT_STOCK,
  TEST_PRODUCT_IDS,
  TEST_SELLER_ID,
} from '@/tests/fixtures/seed';
import { prisma } from '@/lib/db';

const PAYMENT_ID = 'pay_test_confirm_1';

const url = (paymentId: string) =>
  `http://test/api/seller/pagos/${paymentId}/confirmado`;

async function call(
  paymentId: string,
  body: unknown,
  auth = true,
): Promise<{ status: number; body: unknown }> {
  const res = await invokePost(POST, {
    url: url(paymentId),
    body,
    headers: auth ? authHeader() : undefined,
    params: { payment_id: paymentId },
  });
  return { status: res.status, body: await res.json() };
}

// Crea una Reserva directamente en DB + decrementa stock — imita el efecto
// que /reservar hubiera tenido. Mantiene los tests aislados de Fase 6.
async function createReservaRow(input: {
  id: string;
  productId: string;
  orderId: string;
  quantity: number;
  buyerId?: string;
  buyerName?: string;
}): Promise<void> {
  await prisma.reserva.create({
    data: {
      id: input.id,
      productId: input.productId,
      orderId: input.orderId,
      buyerId: input.buyerId ?? 'buyer-x',
      buyerName: input.buyerName ?? 'Comprador X',
      quantity: input.quantity,
      expiresAt: new Date(Date.now() + 30 * 60_000),
    },
  });
  await prisma.product.update({
    where: { id: input.productId },
    data: { stock: { decrement: input.quantity } },
  });
}

function orderItem(overrides: Partial<{
  order_id: string;
  product_id: string;
  quote_id: string;
  amount: number;
  fee: number;
  currency: string;
  paid_at: string;
}> = {}): Record<string, unknown> {
  return {
    order_id: 'ord-default',
    product_id: TEST_PRODUCT_IDS.sillon,
    quote_id: 'qte-default',
    amount: 1000,
    fee: 50,
    currency: 'ARS',
    paid_at: '2026-05-13T12:00:00Z',
    ...overrides,
  };
}

describe('POST /api/seller/pagos/:payment_id/confirmado', () => {
  beforeEach(async () => {
    await resetMutableState();
  });

  it('401 sin auth', async () => {
    const res = await invokePost(POST, {
      url: url(PAYMENT_ID),
      body: { payment_id: PAYMENT_ID, orders: [orderItem()] },
      params: { payment_id: PAYMENT_ID },
    });
    expect(res.status).toBe(401);
  });

  it('400 si falta payment_id en el body', async () => {
    const { status } = await call(PAYMENT_ID, { orders: [orderItem()] });
    expect(status).toBe(400);
  });

  it('400 si orders[] está vacío', async () => {
    const { status } = await call(PAYMENT_ID, { payment_id: PAYMENT_ID, orders: [] });
    expect(status).toBe(400);
  });

  it('400 si payment_id del path no matchea el del body', async () => {
    const { status, body } = await call(PAYMENT_ID, {
      payment_id: 'pay_other',
      orders: [orderItem()],
    });
    expect(status).toBe(400);
    expect((body as { error: string }).error).toBe('payment_id mismatch');
  });

  it('400 si falta un campo requerido en un order item', async () => {
    const { status } = await call(PAYMENT_ID, {
      payment_id: PAYMENT_ID,
      orders: [{ ...orderItem(), fee: undefined }],
    });
    expect(status).toBe(400);
  });

  it('200 happy path: crea Sale con buyer/quantity de Reserva y borra la Reserva', async () => {
    const initialStock = SEED_PRODUCT_STOCK[TEST_PRODUCT_IDS.sillon]!;
    await createReservaRow({
      id: 'rsv_confirm_1',
      productId: TEST_PRODUCT_IDS.sillon,
      orderId: 'ord-confirm-1',
      quantity: 2,
      buyerId: 'buyer-juan',
      buyerName: 'Juan Pérez',
    });
    // Estado pre-confirmar: stock = initialStock - 2, 1 Reserva, 0 Sales nuevas.

    const { status, body } = await call(PAYMENT_ID, {
      payment_id: PAYMENT_ID,
      orders: [
        orderItem({
          order_id: 'ord-confirm-1',
          product_id: TEST_PRODUCT_IDS.sillon,
          amount: 89000,
          fee: 5340,
        }),
      ],
    });
    expect(status).toBe(200);
    expect(body).toEqual({ ok: true });

    // Reserva borrada.
    expect(
      await prisma.reserva.findUnique({ where: { id: 'rsv_confirm_1' } }),
    ).toBeNull();

    // Sale creada con datos de la Reserva (buyer, quantity) + datos del request.
    const sale = await prisma.sale.findFirst({
      where: { orderId: 'ord-confirm-1', productId: TEST_PRODUCT_IDS.sillon },
    });
    expect(sale).not.toBeNull();
    expect(sale!.buyerId).toBe('buyer-juan');
    expect(sale!.buyerName).toBe('Juan Pérez');
    expect(sale!.amount).toBe(2);
    expect(sale!.paymentId).toBe(PAYMENT_ID);
    expect(sale!.sellerId).toBe(TEST_SELLER_ID);
    expect(Number(sale!.total)).toBe(89000);
    expect(Number(sale!.fee)).toBe(5340);
    expect(sale!.status).toBe('paid');
    expect(sale!.trackingCode).toBeNull();

    // Confirmar pago NO toca stock — ya quedó descontado en /reservar.
    const product = await prisma.product.findUnique({
      where: { id: TEST_PRODUCT_IDS.sillon },
      select: { stock: true },
    });
    expect(product!.stock).toBe(initialStock - 2);
  });

  it('200 con múltiples orders: crea todas las Sales y borra todas las Reservas', async () => {
    await createReservaRow({
      id: 'rsv_multi_a',
      productId: TEST_PRODUCT_IDS.sillon,
      orderId: 'ord-multi-a',
      quantity: 1,
    });
    await createReservaRow({
      id: 'rsv_multi_b',
      productId: TEST_PRODUCT_IDS.mesaLuz,
      orderId: 'ord-multi-b',
      quantity: 3,
    });

    const { status } = await call(PAYMENT_ID, {
      payment_id: PAYMENT_ID,
      orders: [
        orderItem({
          order_id: 'ord-multi-a',
          product_id: TEST_PRODUCT_IDS.sillon,
          amount: 89000,
          fee: 5340,
        }),
        orderItem({
          order_id: 'ord-multi-b',
          product_id: TEST_PRODUCT_IDS.mesaLuz,
          amount: 73500,
          fee: 4410,
        }),
      ],
    });
    expect(status).toBe(200);

    expect(await prisma.reserva.findMany({ where: { id: { in: ['rsv_multi_a', 'rsv_multi_b'] } } })).toHaveLength(0);

    const sales = await prisma.sale.findMany({
      where: { paymentId: PAYMENT_ID },
      orderBy: { orderId: 'asc' },
    });
    expect(sales).toHaveLength(2);
    expect(sales.map((s) => s.orderId).sort()).toEqual(['ord-multi-a', 'ord-multi-b']);
  });

  it('409 si una Reserva del lote no existe → ninguna Sale se crea (rollback completo)', async () => {
    const initialSillonStock = SEED_PRODUCT_STOCK[TEST_PRODUCT_IDS.sillon]!;
    // Solo creo Reserva para sillon. mesaLuz no tiene Reserva → debería fallar.
    await createReservaRow({
      id: 'rsv_ok',
      productId: TEST_PRODUCT_IDS.sillon,
      orderId: 'ord-ok',
      quantity: 1,
    });

    const { status, body } = await call(PAYMENT_ID, {
      payment_id: PAYMENT_ID,
      orders: [
        orderItem({ order_id: 'ord-ok', product_id: TEST_PRODUCT_IDS.sillon }),
        orderItem({
          order_id: 'ord-missing',
          product_id: TEST_PRODUCT_IDS.mesaLuz,
        }),
      ],
    });
    expect(status).toBe(409);
    expect((body as { error: string }).error).toContain('ord-missing');

    // Rollback: la Reserva válida sigue existiendo y NO se creó Sale.
    expect(await prisma.reserva.findUnique({ where: { id: 'rsv_ok' } })).not.toBeNull();
    expect(await prisma.sale.findFirst({ where: { paymentId: PAYMENT_ID } })).toBeNull();

    // Stocks intactos (sillon decrementado por la Reserva original; mesaLuz sin cambios).
    const sillon = await prisma.product.findUnique({
      where: { id: TEST_PRODUCT_IDS.sillon },
      select: { stock: true },
    });
    expect(sillon!.stock).toBe(initialSillonStock - 1);
  });

  it('409 si product_id no matchea la Reserva del order_id', async () => {
    // Reserva existe para (ord-x, sillon), pero el request manda (ord-x, mesaLuz).
    await createReservaRow({
      id: 'rsv_mismatch',
      productId: TEST_PRODUCT_IDS.sillon,
      orderId: 'ord-mismatch',
      quantity: 1,
    });

    const { status, body } = await call(PAYMENT_ID, {
      payment_id: PAYMENT_ID,
      orders: [
        orderItem({
          order_id: 'ord-mismatch',
          product_id: TEST_PRODUCT_IDS.mesaLuz,
        }),
      ],
    });
    expect(status).toBe(409);
    expect((body as { error: string }).error).toContain('ord-mismatch');

    // La Reserva original sigue intacta, no se creó Sale.
    expect(await prisma.reserva.findUnique({ where: { id: 'rsv_mismatch' } })).not.toBeNull();
    expect(await prisma.sale.findFirst({ where: { paymentId: PAYMENT_ID } })).toBeNull();
  });

  it('idempotencia negativa: una segunda confirmación del mismo pago devuelve 409', async () => {
    await createReservaRow({
      id: 'rsv_once',
      productId: TEST_PRODUCT_IDS.sillon,
      orderId: 'ord-once',
      quantity: 1,
    });

    const r1 = await call(PAYMENT_ID, {
      payment_id: PAYMENT_ID,
      orders: [orderItem({ order_id: 'ord-once', product_id: TEST_PRODUCT_IDS.sillon })],
    });
    expect(r1.status).toBe(200);

    const r2 = await call(PAYMENT_ID, {
      payment_id: PAYMENT_ID,
      orders: [orderItem({ order_id: 'ord-once', product_id: TEST_PRODUCT_IDS.sillon })],
    });
    expect(r2.status).toBe(409);
  });
});
