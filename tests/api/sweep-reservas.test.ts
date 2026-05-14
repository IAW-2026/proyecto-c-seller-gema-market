import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '@/app/api/internal/sweep-reservas/route';
import { invokeGet } from '@/tests/helpers/invoke';
import { resetMutableState } from '@/tests/helpers/seed-reset';
import { TEST_PRODUCT_IDS, SEED_PRODUCT_STOCK } from '@/tests/fixtures/seed';
import { prisma } from '@/lib/db';

const URL = 'http://test/api/internal/sweep-reservas';

function cronAuthHeader(): Record<string, string> {
  return { authorization: `Bearer ${process.env.CRON_SECRET}` };
}

async function createReservaRow(input: {
  id: string;
  productId: string;
  orderId: string;
  quantity: number;
  expiresAt: Date;
}): Promise<void> {
  await prisma.reserva.create({
    data: {
      id: input.id,
      productId: input.productId,
      orderId: input.orderId,
      buyerId: 'buyer-x',
      buyerName: 'Comprador X',
      quantity: input.quantity,
      expiresAt: input.expiresAt,
    },
  });
  // Reflejar el descuento de stock que hubiera hecho /reservar.
  await prisma.product.update({
    where: { id: input.productId },
    data: { stock: { decrement: input.quantity } },
  });
}

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000);
const minutesAhead = (n: number) => new Date(Date.now() + n * 60_000);

describe('GET /api/internal/sweep-reservas (cron)', () => {
  beforeEach(async () => {
    await resetMutableState();
  });

  it('401 sin auth', async () => {
    const res = await invokeGet(GET, { url: URL });
    expect(res.status).toBe(401);
  });

  it('401 con token incorrecto', async () => {
    const res = await invokeGet(GET, {
      url: URL,
      headers: { authorization: 'Bearer wrong' },
    });
    expect(res.status).toBe(401);
  });

  it('200 con 0 reservas barridas cuando no hay nada expirado', async () => {
    const res = await invokeGet(GET, { url: URL, headers: cronAuthHeader() });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      swept_count: 0,
      swept_reserva_ids: [],
    });
  });

  it('barre una reserva expirada y restaura su stock', async () => {
    const initialStock = SEED_PRODUCT_STOCK[TEST_PRODUCT_IDS.sillon]!;
    await createReservaRow({
      id: 'rsv_expired_1',
      productId: TEST_PRODUCT_IDS.sillon,
      orderId: 'ord-expired-1',
      quantity: 2,
      expiresAt: minutesAgo(1),
    });
    // Stock actual = initialStock - 2 (después del decremento simulado).

    const res = await invokeGet(GET, { url: URL, headers: cronAuthHeader() });
    const body = (await res.json()) as {
      swept_count: number;
      swept_reserva_ids: string[];
    };
    expect(body.swept_count).toBe(1);
    expect(body.swept_reserva_ids).toEqual(['rsv_expired_1']);

    const reserva = await prisma.reserva.findUnique({ where: { id: 'rsv_expired_1' } });
    expect(reserva).toBeNull();

    const product = await prisma.product.findUnique({
      where: { id: TEST_PRODUCT_IDS.sillon },
      select: { stock: true },
    });
    expect(product!.stock).toBe(initialStock);
  });

  it('agrupa increments cuando varias reservas expiradas son del mismo producto', async () => {
    const initialStock = SEED_PRODUCT_STOCK[TEST_PRODUCT_IDS.vajilla]!;
    await createReservaRow({
      id: 'rsv_expired_a',
      productId: TEST_PRODUCT_IDS.vajilla,
      orderId: 'ord-a',
      quantity: 3,
      expiresAt: minutesAgo(2),
    });
    await createReservaRow({
      id: 'rsv_expired_b',
      productId: TEST_PRODUCT_IDS.vajilla,
      orderId: 'ord-b',
      quantity: 5,
      expiresAt: minutesAgo(1),
    });
    // Stock actual = initialStock - 8.

    const res = await invokeGet(GET, { url: URL, headers: cronAuthHeader() });
    const body = (await res.json()) as { swept_count: number };
    expect(body.swept_count).toBe(2);

    const product = await prisma.product.findUnique({
      where: { id: TEST_PRODUCT_IDS.vajilla },
      select: { stock: true },
    });
    expect(product!.stock).toBe(initialStock);
  });

  it('NO barre reservas que todavía no expiraron', async () => {
    await createReservaRow({
      id: 'rsv_future',
      productId: TEST_PRODUCT_IDS.sillon,
      orderId: 'ord-future',
      quantity: 1,
      expiresAt: minutesAhead(10),
    });

    const res = await invokeGet(GET, { url: URL, headers: cronAuthHeader() });
    const body = (await res.json()) as { swept_count: number };
    expect(body.swept_count).toBe(0);

    const reserva = await prisma.reserva.findUnique({ where: { id: 'rsv_future' } });
    expect(reserva).not.toBeNull();
  });

  it('barre solo las expiradas dejando las vigentes intactas', async () => {
    const initialStock = SEED_PRODUCT_STOCK[TEST_PRODUCT_IDS.mesaLuz]!;
    await createReservaRow({
      id: 'rsv_old',
      productId: TEST_PRODUCT_IDS.mesaLuz,
      orderId: 'ord-old',
      quantity: 1,
      expiresAt: minutesAgo(5),
    });
    await createReservaRow({
      id: 'rsv_fresh',
      productId: TEST_PRODUCT_IDS.mesaLuz,
      orderId: 'ord-fresh',
      quantity: 2,
      expiresAt: minutesAhead(20),
    });
    // Stock actual = initialStock - 3.

    const res = await invokeGet(GET, { url: URL, headers: cronAuthHeader() });
    const body = (await res.json()) as { swept_count: number; swept_reserva_ids: string[] };
    expect(body.swept_count).toBe(1);
    expect(body.swept_reserva_ids).toEqual(['rsv_old']);

    expect(await prisma.reserva.findUnique({ where: { id: 'rsv_old' } })).toBeNull();
    expect(await prisma.reserva.findUnique({ where: { id: 'rsv_fresh' } })).not.toBeNull();

    const product = await prisma.product.findUnique({
      where: { id: TEST_PRODUCT_IDS.mesaLuz },
      select: { stock: true },
    });
    // Solo se restauró la quantity de rsv_old (1) → stock = initialStock - 2.
    expect(product!.stock).toBe(initialStock - 2);
  });

  it('idempotente: una segunda corrida no hace nada', async () => {
    await createReservaRow({
      id: 'rsv_once',
      productId: TEST_PRODUCT_IDS.sillon,
      orderId: 'ord-once',
      quantity: 1,
      expiresAt: minutesAgo(1),
    });

    const r1 = await (await invokeGet(GET, { url: URL, headers: cronAuthHeader() })).json();
    expect((r1 as { swept_count: number }).swept_count).toBe(1);

    const r2 = await (await invokeGet(GET, { url: URL, headers: cronAuthHeader() })).json();
    expect((r2 as { swept_count: number }).swept_count).toBe(0);
  });
});
