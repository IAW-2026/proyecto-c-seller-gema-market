import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/seller/admin/stats/route';
import { invokeGet } from '@/tests/helpers/invoke';
import { authHeader } from '@/tests/helpers/auth';
import { TEST_SELLER_ID } from '@/tests/fixtures/seed';
import type { AdminStatsResponse } from '@/lib/api/contracts/admin/stats';

const BASE = 'http://test/api/seller/admin/stats';

async function call(query = ''): Promise<{ status: number; body: AdminStatsResponse }> {
  const res = await invokeGet(GET, { url: `${BASE}${query}`, headers: authHeader() });
  return { status: res.status, body: (await res.json()) as AdminStatsResponse };
}

describe('GET /api/seller/admin/stats', () => {
  it('401 sin auth', async () => {
    const res = await invokeGet(GET, { url: BASE });
    expect(res.status).toBe(401);
  });

  it('200 agrega los totales del marketplace sobre el seed', async () => {
    const { status, body } = await call();
    expect(status).toBe(200);
    // 7 productos no borrados (todos menos lampara).
    expect(body.total_products).toBe(7);
    expect(body.products_by_status).toEqual({ active: 6, paused: 1 });
    expect(body.hidden_products).toBe(0);
    expect(body.total_sales).toBe(3);
    expect(body.total_revenue).toBe(144700); // 89000 + 24500 + 31200
    expect(body.currency).toBe('ARS');
  });

  it('top_categories y top_sellers tienen el shape correcto', async () => {
    const { body } = await call();
    expect(body.top_categories.length).toBeGreaterThan(0);
    for (const c of body.top_categories) {
      expect(Object.keys(c).sort()).toEqual(['category_id', 'count', 'name'].sort());
    }
    expect(body.top_sellers.length).toBeGreaterThan(0);
    const main = body.top_sellers.find((s) => s.seller_id === TEST_SELLER_ID);
    expect(main?.revenue).toBe(144700);
  });

  it('date_from en el futuro deja las métricas de ventas en cero', async () => {
    const { body } = await call('?date_from=2030-01-01T00:00:00Z');
    expect(body.total_sales).toBe(0);
    expect(body.total_revenue).toBe(0);
    expect(body.top_sellers).toHaveLength(0);
    // Los conteos de productos son point-in-time, no dependen del rango.
    expect(body.total_products).toBe(7);
  });

  it('400 si date_from no es ISO', async () => {
    const res = await invokeGet(GET, { url: `${BASE}?date_from=ayer`, headers: authHeader() });
    expect(res.status).toBe(400);
  });
});
