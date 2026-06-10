import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/seller/admin/productos/route';
import { invokeGet } from '@/tests/helpers/invoke';
import { authHeader } from '@/tests/helpers/auth';
import {
  TEST_SELLER_ID,
  TEST_OTHER_SELLER_ID,
  TEST_CATEGORY_IDS,
  TEST_PRODUCT_IDS,
} from '@/tests/fixtures/seed';
import type { AdminProductListResponse } from '@/lib/api/contracts/admin/products';

const BASE = 'http://test/api/seller/admin/productos';

async function call(
  query = '',
): Promise<{ status: number; body: AdminProductListResponse }> {
  const res = await invokeGet(GET, { url: `${BASE}${query}`, headers: authHeader() });
  return { status: res.status, body: (await res.json()) as AdminProductListResponse };
}

describe('GET /api/seller/admin/productos', () => {
  it('401 sin auth', async () => {
    const res = await invokeGet(GET, { url: BASE });
    expect(res.status).toBe(401);
  });

  it('200 sin filtros: incluye paused, excluye soft-deleted (7 productos)', async () => {
    const { status, body } = await call();
    expect(status).toBe(200);
    expect(body.total).toBe(7);
    const ids = body.items.map((i) => i.product_id);
    expect(ids).toContain(TEST_PRODUCT_IDS.cortina); // paused → sí aparece
    expect(ids).not.toContain(TEST_PRODUCT_IDS.lampara); // soft-deleted → no
  });

  it('shape del item matchea el contrato admin (snake_case)', async () => {
    const { body } = await call();
    const item = body.items[0]!;
    expect(Object.keys(item).sort()).toEqual(
      [
        'product_id', 'seller_id', 'seller_name', 'title', 'thumbnail_url',
        'price', 'currency', 'category_id', 'category_name', 'status',
        'condition', 'stock', 'hidden_by_admin', 'deleted_at', 'created_at',
      ].sort(),
    );
  });

  it('include_deleted=true incorpora el soft-deleted (8 productos)', async () => {
    const { body } = await call('?include_deleted=true');
    expect(body.total).toBe(8);
    const lampara = body.items.find((i) => i.product_id === TEST_PRODUCT_IDS.lampara);
    expect(lampara).toBeDefined();
    expect(lampara!.deleted_at).not.toBeNull();
  });

  it('filtra por status=paused (solo cortina)', async () => {
    const { body } = await call('?status=paused');
    expect(body.total).toBe(1);
    expect(body.items[0]?.product_id).toBe(TEST_PRODUCT_IDS.cortina);
    expect(body.items[0]?.status).toBe('paused');
  });

  it('filtra por status=active (6 productos)', async () => {
    const { body } = await call('?status=active');
    expect(body.total).toBe(6);
    expect(body.items.every((i) => i.status === 'active')).toBe(true);
  });

  it('filtra por seller_id (excluye al ajeno)', async () => {
    const { body } = await call(`?seller_id=${TEST_SELLER_ID}`);
    expect(body.total).toBe(6);
    expect(body.items.every((i) => i.seller_id === TEST_SELLER_ID)).toBe(true);
  });

  it('filtra por category_id=cocina (3 productos, incl. ajeno)', async () => {
    const { body } = await call(`?category_id=${TEST_CATEGORY_IDS.cocina}`);
    expect(body.total).toBe(3);
    expect(body.items.some((i) => i.seller_id === TEST_OTHER_SELLER_ID)).toBe(true);
  });

  it('filtra por condition=usado (solo sillón)', async () => {
    const { body } = await call('?condition=usado');
    expect(body.total).toBe(1);
    expect(body.items[0]?.product_id).toBe(TEST_PRODUCT_IDS.sillon);
  });

  it('filtra por rango de precio', async () => {
    const { body } = await call('?min_price=20000&max_price=30000');
    expect(body.total).toBe(1);
    expect(body.items[0]?.product_id).toBe(TEST_PRODUCT_IDS.mesaLuz);
  });

  it('sort_by=stock order=desc ordena por stock', async () => {
    const { body } = await call('?sort_by=stock&order=desc');
    expect(body.sort_by).toBe('stock');
    const stocks = body.items.map((i) => i.stock);
    expect(stocks).toEqual([...stocks].sort((a, b) => b - a));
    expect(body.items[0]?.product_id).toBe(TEST_PRODUCT_IDS.cortina); // stock 30
  });

  it('paginación: page_size=2 devuelve 2 items con total=7', async () => {
    const { body } = await call('?page=1&page_size=2');
    expect(body.items).toHaveLength(2);
    expect(body.total).toBe(7);
    expect(body.page).toBe(1);
    expect(body.page_size).toBe(2);
  });

  it('400 si page_size supera el máximo', async () => {
    const res = await invokeGet(GET, { url: `${BASE}?page_size=200`, headers: authHeader() });
    expect(res.status).toBe(400);
  });
});
