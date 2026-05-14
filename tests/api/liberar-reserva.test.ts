import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/seller/productos/[product_id]/liberar-reserva/route';
import { invokePost } from '@/tests/helpers/invoke';
import { authHeader } from '@/tests/helpers/auth';
import { resetMutableState } from '@/tests/helpers/seed-reset';
import {
  SEED_PRODUCT_STOCK,
  TEST_PRODUCT_IDS,
} from '@/tests/fixtures/seed';
import { prisma } from '@/lib/db';

const url = (productId: string) =>
  `http://test/api/seller/productos/${productId}/liberar-reserva`;

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

// Helper: crea una Reserva directamente en DB + decrementa stock, imitando
// el efecto que /reservar hubiera tenido. Mantiene los tests aislados de Fase 6.
async function createReservaRow(input: {
  id: string;
  productId: string;
  orderId: string;
  quantity: number;
}): Promise<void> {
  await prisma.reserva.create({
    data: {
      id: input.id,
      productId: input.productId,
      orderId: input.orderId,
      buyerId: 'buyer-x',
      buyerName: 'Comprador X',
      quantity: input.quantity,
      expiresAt: new Date(Date.now() + 30 * 60_000),
    },
  });
  await prisma.product.update({
    where: { id: input.productId },
    data: { stock: { decrement: input.quantity } },
  });
}

describe('POST /api/seller/productos/:product_id/liberar-reserva', () => {
  beforeEach(async () => {
    await resetMutableState();
  });

  it('401 sin auth', async () => {
    const res = await invokePost(POST, {
      url: url(TEST_PRODUCT_IDS.sillon),
      body: { order_id: 'ord-x' },
      params: { product_id: TEST_PRODUCT_IDS.sillon },
    });
    expect(res.status).toBe(401);
  });

  it('400 si falta order_id', async () => {
    const { status } = await call(TEST_PRODUCT_IDS.sillon, {});
    expect(status).toBe(400);
  });

  it('400 si order_id es string vacío', async () => {
    const { status } = await call(TEST_PRODUCT_IDS.sillon, { order_id: '' });
    expect(status).toBe(400);
  });

  it('200 happy path: borra la Reserva y restaura el stock', async () => {
    const initialStock = SEED_PRODUCT_STOCK[TEST_PRODUCT_IDS.sillon]!;
    await createReservaRow({
      id: 'rsv_to_release',
      productId: TEST_PRODUCT_IDS.sillon,
      orderId: 'ord-rel-1',
      quantity: 3,
    });
    // Estado pre-liberar: stock = initialStock - 3, 1 Reserva.

    const { status, body } = await call(TEST_PRODUCT_IDS.sillon, {
      order_id: 'ord-rel-1',
    });
    expect(status).toBe(200);
    expect(body).toEqual({ ok: true });

    // La Reserva fue borrada.
    expect(await prisma.reserva.findUnique({ where: { id: 'rsv_to_release' } })).toBeNull();
    expect(
      await prisma.reserva.findFirst({ where: { orderId: 'ord-rel-1' } }),
    ).toBeNull();

    // El stock volvió al valor inicial.
    const product = await prisma.product.findUnique({
      where: { id: TEST_PRODUCT_IDS.sillon },
      select: { stock: true },
    });
    expect(product!.stock).toBe(initialStock);
  });

  it('404 si no existe Reserva activa para ese order_id', async () => {
    const { status, body } = await call(TEST_PRODUCT_IDS.sillon, {
      order_id: 'ord-never-existed',
    });
    expect(status).toBe(404);
    expect((body as { error: string }).error).toBe('Not Found');
  });

  it('404 si la Reserva existe pero el product_id del path no matchea', async () => {
    const initialSillonStock = SEED_PRODUCT_STOCK[TEST_PRODUCT_IDS.sillon]!;
    const initialMesaStock = SEED_PRODUCT_STOCK[TEST_PRODUCT_IDS.mesaLuz]!;
    await createReservaRow({
      id: 'rsv_mismatch',
      productId: TEST_PRODUCT_IDS.sillon,
      orderId: 'ord-mismatch',
      quantity: 2,
    });

    // Llamamos liberar-reserva sobre mesaLuz pero la Reserva es del sillon.
    const { status } = await call(TEST_PRODUCT_IDS.mesaLuz, {
      order_id: 'ord-mismatch',
    });
    expect(status).toBe(404);

    // La Reserva sigue existiendo y los stocks no se tocaron.
    expect(await prisma.reserva.findUnique({ where: { id: 'rsv_mismatch' } })).not.toBeNull();
    const sillon = await prisma.product.findUnique({
      where: { id: TEST_PRODUCT_IDS.sillon },
      select: { stock: true },
    });
    const mesa = await prisma.product.findUnique({
      where: { id: TEST_PRODUCT_IDS.mesaLuz },
      select: { stock: true },
    });
    expect(sillon!.stock).toBe(initialSillonStock - 2);
    expect(mesa!.stock).toBe(initialMesaStock);
  });

  it('idempotencia negativa: liberar dos veces el mismo order_id devuelve 200 + 404', async () => {
    await createReservaRow({
      id: 'rsv_once',
      productId: TEST_PRODUCT_IDS.sillon,
      orderId: 'ord-once',
      quantity: 1,
    });

    const r1 = await call(TEST_PRODUCT_IDS.sillon, { order_id: 'ord-once' });
    expect(r1.status).toBe(200);

    const r2 = await call(TEST_PRODUCT_IDS.sillon, { order_id: 'ord-once' });
    expect(r2.status).toBe(404);
  });
});
