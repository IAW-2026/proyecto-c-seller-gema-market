import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/seller/ventas/[order_id]/estado-envio/route';
import { invokePost } from '@/tests/helpers/invoke';
import { authHeader } from '@/tests/helpers/auth';
import { resetMutableState } from '@/tests/helpers/seed-reset';
import { TEST_SALES } from '@/tests/fixtures/seed';
import { prisma } from '@/lib/db';

const url = (orderId: string) =>
  `http://test/api/seller/ventas/${orderId}/estado-envio`;

async function call(
  orderId: string,
  body: unknown,
  auth = true,
): Promise<{ status: number; body: unknown }> {
  const res = await invokePost(POST, {
    url: url(orderId),
    body,
    headers: auth ? authHeader() : undefined,
    params: { order_id: orderId },
  });
  return { status: res.status, body: await res.json() };
}

function envioBody(overrides: Partial<{
  order_id: string;
  status: string;
  tracking_code: string;
  updated_at: string;
}> = {}): Record<string, unknown> {
  return {
    order_id: TEST_SALES.paid,
    status: 'in_transit',
    tracking_code: 'TRK-DEFAULT',
    updated_at: '2026-05-13T12:00:00Z',
    ...overrides,
  };
}

describe('POST /api/seller/ventas/:order_id/estado-envio', () => {
  beforeEach(async () => {
    await resetMutableState();
  });

  it('401 sin auth', async () => {
    const res = await invokePost(POST, {
      url: url(TEST_SALES.paid),
      body: envioBody(),
      params: { order_id: TEST_SALES.paid },
    });
    expect(res.status).toBe(401);
  });

  it('400 si falta tracking_code', async () => {
    const { status } = await call(TEST_SALES.paid, {
      ...envioBody(),
      tracking_code: undefined,
    });
    expect(status).toBe(400);
  });

  it('400 si tracking_code es string vacío', async () => {
    const { status } = await call(TEST_SALES.paid, envioBody({ tracking_code: '' }));
    expect(status).toBe(400);
  });

  it('400 si status no está en el vocabulario de Shipping', async () => {
    const { status } = await call(TEST_SALES.paid, envioBody({ status: 'in_warehouse' }));
    expect(status).toBe(400);
  });

  it('400 si order_id del path no matchea el del body', async () => {
    const { status, body } = await call(TEST_SALES.paid, envioBody({ order_id: 'ord-otro' }));
    expect(status).toBe(400);
    expect((body as { error: string }).error).toBe('order_id mismatch');
  });

  it('400 si status no es string conocido (sale del enum)', async () => {
    const { status } = await call(TEST_SALES.paid, envioBody({ status: 'cancelled' }));
    expect(status).toBe(400);
  });

  it('200 con status=in_transit: Sale pasa a shipping y persiste tracking', async () => {
    const { status, body } = await call(TEST_SALES.paid, envioBody({
      order_id: TEST_SALES.paid,
      status: 'in_transit',
      tracking_code: 'TRK-IN-TRANSIT-1',
    }));
    expect(status).toBe(200);
    expect(body).toEqual({ ok: true });

    const sale = await prisma.sale.findFirst({ where: { orderId: TEST_SALES.paid } });
    expect(sale!.status).toBe('shipping');
    expect(sale!.trackingCode).toBe('TRK-IN-TRANSIT-1');
  });

  it('200 con status=delivered: Sale pasa a delivered', async () => {
    const { status } = await call(TEST_SALES.shipping, envioBody({
      order_id: TEST_SALES.shipping,
      status: 'delivered',
      tracking_code: 'TRK-SHIPPING-002',
    }));
    expect(status).toBe(200);

    const sale = await prisma.sale.findFirst({ where: { orderId: TEST_SALES.shipping } });
    expect(sale!.status).toBe('delivered');
    expect(sale!.trackingCode).toBe('TRK-SHIPPING-002');
  });

  it('200 con status=failed: Sale pasa a shipping_failed', async () => {
    const { status } = await call(TEST_SALES.shipping, envioBody({
      order_id: TEST_SALES.shipping,
      status: 'failed',
      tracking_code: 'TRK-FAILED-X',
    }));
    expect(status).toBe(200);

    const sale = await prisma.sale.findFirst({ where: { orderId: TEST_SALES.shipping } });
    expect(sale!.status).toBe('shipping_failed');
    expect(sale!.trackingCode).toBe('TRK-FAILED-X');
  });

  it('200 acepta transición no monotónica: delivered → shipping_failed (Shipping App es autoridad)', async () => {
    // La venta delivered del seed rebota: Shipping App reporta failed.
    const { status } = await call(TEST_SALES.delivered, envioBody({
      order_id: TEST_SALES.delivered,
      status: 'failed',
      tracking_code: 'TRK-RETURN',
    }));
    expect(status).toBe(200);

    const sale = await prisma.sale.findFirst({ where: { orderId: TEST_SALES.delivered } });
    expect(sale!.status).toBe('shipping_failed');
    expect(sale!.trackingCode).toBe('TRK-RETURN');
  });

  it('404 si no existe Sale para ese order_id', async () => {
    const { status } = await call('ord-nonexistent', envioBody({
      order_id: 'ord-nonexistent',
      tracking_code: 'TRK-X',
    }));
    expect(status).toBe(404);
  });
});
