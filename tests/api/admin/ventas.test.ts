import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/seller/admin/ventas/route';
import { invokeGet } from '@/tests/helpers/invoke';
import { authHeader } from '@/tests/helpers/auth';
import { TEST_SELLER_ID, TEST_OTHER_SELLER_ID } from '@/tests/fixtures/seed';
import type { AdminSaleListResponse } from '@/lib/api/contracts/admin/sales';

const BASE = 'http://test/api/seller/admin/ventas';

async function call(
  query = '',
): Promise<{ status: number; body: AdminSaleListResponse }> {
  const res = await invokeGet(GET, { url: `${BASE}${query}`, headers: authHeader() });
  return { status: res.status, body: (await res.json()) as AdminSaleListResponse };
}

describe('GET /api/seller/admin/ventas', () => {
  it('401 sin auth', async () => {
    const res = await invokeGet(GET, { url: BASE });
    expect(res.status).toBe(401);
  });

  it('200 lista las 3 ventas del seed', async () => {
    const { status, body } = await call();
    expect(status).toBe(200);
    expect(body.total).toBe(3);
    expect(body.items).toHaveLength(3);
  });

  it('shape del item matchea el contrato (amount = total, incluye fee y tracking)', async () => {
    const { body } = await call();
    const item = body.items[0]!;
    expect(Object.keys(item).sort()).toEqual(
      [
        'venta_id', 'order_id', 'product_id', 'seller_id', 'buyer_id',
        'buyer_name', 'amount', 'fee', 'status', 'tracking_code', 'created_at',
      ].sort(),
    );
  });

  it('default sort = created_at desc (la más reciente primero)', async () => {
    const { body } = await call();
    expect(body.items[0]?.status).toBe('paid'); // vnt_test_001, 3d ago
    expect(body.sort_by).toBe('created_at');
    expect(body.order).toBe('desc');
  });

  it('amount expone Sale.total (no la cantidad de unidades)', async () => {
    const { body } = await call('?status=paid');
    expect(body.total).toBe(1);
    expect(body.items[0]?.amount).toBe(89000);
    expect(body.items[0]?.fee).toBe(5340);
    expect(body.items[0]?.tracking_code).toBeNull();
  });

  it('filtra por status=shipping (incluye tracking_code)', async () => {
    const { body } = await call('?status=shipping');
    expect(body.total).toBe(1);
    expect(body.items[0]?.tracking_code).toBe('TRK-TEST-002');
  });

  it('sort_by=total order=desc ordena por monto', async () => {
    const { body } = await call('?sort_by=total&order=desc');
    expect(body.items.map((i) => i.amount)).toEqual([89000, 31200, 24500]);
  });

  it('filtra por seller_id', async () => {
    const main = await call(`?seller_id=${TEST_SELLER_ID}`);
    expect(main.body.total).toBe(3);
    const other = await call(`?seller_id=${TEST_OTHER_SELLER_ID}`);
    expect(other.body.total).toBe(0);
  });

  it('400 si el status es inválido', async () => {
    const res = await invokeGet(GET, { url: `${BASE}?status=cancelled`, headers: authHeader() });
    expect(res.status).toBe(400);
  });
});
