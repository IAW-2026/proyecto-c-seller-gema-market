import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/seller/productos/[product_id]/reservar/route';
import { invokePost } from '@/tests/helpers/invoke';
import { authHeader } from '@/tests/helpers/auth';
import { resetMutableState } from '@/tests/helpers/seed-reset';
import { TEST_PRODUCT_IDS, TEST_SALES } from '@/tests/fixtures/seed';
import { prisma } from '@/lib/db';

const url = (productId: string) =>
  `http://test/api/seller/productos/${productId}/reservar`;

async function call(
  productId: string,
  body: unknown,
  auth = true,
): Promise<{ status: number; body: unknown }> {
  const res = await invokePost(POST, {
    url: url(productId),
    body,
    headers: auth ? authHeader() : undefined,
    params: { product_id: productId },
  });
  return { status: res.status, body: await res.json() };
}

// Suite mutating: reset entre tests para volver al stock/Reservas del seed.
describe('POST /api/seller/productos/:product_id/reservar', () => {
  beforeEach(async () => {
    await resetMutableState();
  });

  it('401 sin auth', async () => {
    const res = await invokePost(POST, {
      url: url(TEST_PRODUCT_IDS.sillon),
      body: { order_id: 'ord-x', buyer_id: 'b', buyer_name: 'B', quantity: 1 },
      params: { product_id: TEST_PRODUCT_IDS.sillon },
    });
    expect(res.status).toBe(401);
  });

  it('400 si falta buyer_name', async () => {
    const { status } = await call(TEST_PRODUCT_IDS.sillon, {
      order_id: 'ord-x',
      buyer_id: 'b',
      quantity: 1,
    });
    expect(status).toBe(400);
  });

  it('400 si quantity <= 0', async () => {
    const { status } = await call(TEST_PRODUCT_IDS.sillon, {
      order_id: 'ord-x',
      buyer_id: 'b',
      buyer_name: 'B',
      quantity: 0,
    });
    expect(status).toBe(400);
  });

  it('400 si quantity no es entero', async () => {
    const { status } = await call(TEST_PRODUCT_IDS.sillon, {
      order_id: 'ord-x',
      buyer_id: 'b',
      buyer_name: 'B',
      quantity: 1.5,
    });
    expect(status).toBe(400);
  });

  it('200 reserva exitosa: decrementa stock, crea Reserva con todos los campos del request + expiresAt asignado por el server', async () => {
    const before = await prisma.product.findUnique({
      where: { id: TEST_PRODUCT_IDS.sillon },
      select: { stock: true },
    });
    const tBeforeCall = Date.now();

    const { status, body } = await call(TEST_PRODUCT_IDS.sillon, {
      order_id: 'ord-new-001',
      buyer_id: 'buyer-new-001',
      buyer_name: 'Nuevo Comprador',
      quantity: 2,
    });
    const tAfterCall = Date.now();

    expect(status).toBe(200);
    expect(body).toEqual({ ok: true });

    // Stock decrementado exactamente por `quantity`.
    const after = await prisma.product.findUnique({
      where: { id: TEST_PRODUCT_IDS.sillon },
      select: { stock: true },
    });
    expect(after!.stock).toBe(before!.stock - 2);

    // Reserva creada con TODOS los campos del request + expiresAt server-side.
    const reservas = await prisma.reserva.findMany({
      where: { orderId: 'ord-new-001' },
    });
    expect(reservas).toHaveLength(1);
    const r = reservas[0]!;
    expect(r.productId).toBe(TEST_PRODUCT_IDS.sillon);
    expect(r.orderId).toBe('ord-new-001');
    expect(r.buyerId).toBe('buyer-new-001');
    expect(r.buyerName).toBe('Nuevo Comprador');
    expect(r.quantity).toBe(2);

    // expiresAt está entre [tBefore + TTL, tAfter + TTL]. TTL = 30 min default.
    const ttlMs = 30 * 60_000;
    expect(r.expiresAt.getTime()).toBeGreaterThanOrEqual(tBeforeCall + ttlMs - 1000);
    expect(r.expiresAt.getTime()).toBeLessThanOrEqual(tAfterCall + ttlMs + 1000);

    // createdAt cerca del momento del request.
    expect(r.createdAt.getTime()).toBeGreaterThanOrEqual(tBeforeCall - 1000);
    expect(r.createdAt.getTime()).toBeLessThanOrEqual(tAfterCall + 1000);
  });

  it('409 si la cantidad pedida supera el stock', async () => {
    // pava tiene stock 1 en el seed.
    const { status, body } = await call(TEST_PRODUCT_IDS.pava, {
      order_id: 'ord-overstock',
      buyer_id: 'b',
      buyer_name: 'B',
      quantity: 5,
    });
    expect(status).toBe(409);
    expect((body as { error: string }).error).toBe('Insufficient stock');

    // El stock no debe haberse tocado.
    const product = await prisma.product.findUnique({
      where: { id: TEST_PRODUCT_IDS.pava },
      select: { stock: true },
    });
    expect(product!.stock).toBe(1);
  });

  it('409 si el producto está en stock 0', async () => {
    const { status, body } = await call(TEST_PRODUCT_IDS.espejo, {
      order_id: 'ord-zero',
      buyer_id: 'b',
      buyer_name: 'B',
      quantity: 1,
    });
    expect(status).toBe(409);
    expect((body as { error: string }).error).toBe('Insufficient stock');
  });

  it('404 si el producto no existe', async () => {
    const { status } = await call('prd_does_not_exist', {
      order_id: 'ord-x',
      buyer_id: 'b',
      buyer_name: 'B',
      quantity: 1,
    });
    expect(status).toBe(404);
  });

  it('404 si el producto está paused', async () => {
    const { status } = await call(TEST_PRODUCT_IDS.cortina, {
      order_id: 'ord-x',
      buyer_id: 'b',
      buyer_name: 'B',
      quantity: 1,
    });
    expect(status).toBe(404);
  });

  it('404 si el producto está soft-deleted', async () => {
    const { status } = await call(TEST_PRODUCT_IDS.lampara, {
      order_id: 'ord-x',
      buyer_id: 'b',
      buyer_name: 'B',
      quantity: 1,
    });
    expect(status).toBe(404);
  });

  it('409 si el orderId ya tiene una Reserva activa (reintento del Payments)', async () => {
    const body = {
      order_id: 'ord-dup',
      buyer_id: 'b',
      buyer_name: 'B',
      quantity: 1,
    };
    const first = await call(TEST_PRODUCT_IDS.sillon, body);
    expect(first.status).toBe(200);

    const retry = await call(TEST_PRODUCT_IDS.sillon, body);
    expect(retry.status).toBe(409);
    expect((retry.body as { error: string }).error).toBe('Order already reserved');
  });

  it('409 si el orderId ya tiene una Sale (orden ya concretada)', async () => {
    // TEST_SALES.paid es un orderId con Sale existente en el seed.
    const { status, body } = await call(TEST_PRODUCT_IDS.sillon, {
      order_id: TEST_SALES.paid,
      buyer_id: 'b',
      buyer_name: 'B',
      quantity: 1,
    });
    expect(status).toBe(409);
    expect((body as { error: string }).error).toBe('Order already sold');
  });

  it('atomicidad: dos reservas concurrentes por el último unit — solo una gana', async () => {
    // pava tiene stock 1.
    const [r1, r2] = await Promise.all([
      call(TEST_PRODUCT_IDS.pava, {
        order_id: 'ord-race-1',
        buyer_id: 'b1',
        buyer_name: 'B1',
        quantity: 1,
      }),
      call(TEST_PRODUCT_IDS.pava, {
        order_id: 'ord-race-2',
        buyer_id: 'b2',
        buyer_name: 'B2',
        quantity: 1,
      }),
    ]);

    const statuses = [r1.status, r2.status].sort();
    expect(statuses).toEqual([200, 409]);

    // Stock final: 0. Exactamente una Reserva creada.
    const product = await prisma.product.findUnique({
      where: { id: TEST_PRODUCT_IDS.pava },
      select: { stock: true },
    });
    expect(product!.stock).toBe(0);

    const reservas = await prisma.reserva.findMany({
      where: { productId: TEST_PRODUCT_IDS.pava },
    });
    expect(reservas).toHaveLength(1);
  });
});
