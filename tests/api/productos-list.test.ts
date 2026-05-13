import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/seller/productos/route';
import { invokeGet } from '@/tests/helpers/invoke';
import { authHeader } from '@/tests/helpers/auth';
import {
  TEST_SELLER_ID,
  TEST_OTHER_SELLER_ID,
  TEST_CATEGORY_IDS,
  TEST_PRODUCT_IDS,
} from '@/tests/fixtures/seed';

const BASE = 'http://test/api/seller/productos';

type ListItem = {
  product_id: string;
  seller_id: string;
  title: string;
  price: number;
  currency: string;
  category_id: string;
  condition: 'nuevo' | 'usado';
  thumbnail_url: string | null;
  href: string;
};

type ListResponse = {
  items: ListItem[];
  page: number;
  page_size: number;
  total: number;
  sort_by: string;
  order: string;
};

async function call(query = '', auth = true): Promise<{ status: number; body: ListResponse }> {
  const res = await invokeGet(GET, {
    url: `${BASE}${query}`,
    headers: auth ? authHeader() : undefined,
  });
  return { status: res.status, body: (await res.json()) as ListResponse };
}

describe('GET /api/seller/productos', () => {
  it('401 sin auth', async () => {
    const res = await invokeGet(GET, { url: BASE });
    expect(res.status).toBe(401);
  });

  it('200 sin filtros: devuelve los 6 productos activos visibles (excluye paused y soft-deleted)', async () => {
    const { status, body } = await call();
    expect(status).toBe(200);
    expect(body.total).toBe(6);
    expect(body.items).toHaveLength(6);
    // El seed tiene 5 active del seller principal (sillon, mesaLuz, pava,
    // vajilla, espejo) + 1 de otro seller (ajeno). Cortina (paused) y lampara
    // (soft-deleted) NO deben aparecer.
    const ids = body.items.map((i) => i.product_id).sort();
    expect(ids).not.toContain(TEST_PRODUCT_IDS.cortina);
    expect(ids).not.toContain(TEST_PRODUCT_IDS.lampara);
    expect(ids).toContain(TEST_PRODUCT_IDS.ajeno);
  });

  it('shape del item matchea el contrato (snake_case + href absoluto)', async () => {
    const { body } = await call();
    const item = body.items[0]!;
    expect(Object.keys(item).sort()).toEqual(
      [
        'product_id',
        'seller_id',
        'title',
        'price',
        'currency',
        'category_id',
        'condition',
        'thumbnail_url',
        'href',
      ].sort(),
    );
    expect(item.href).toBe(`http://test/api/seller/productos/${item.product_id}`);
  });

  it('default sort = created_at desc: el más reciente primero', async () => {
    const { body } = await call();
    // espejo (5d) < ajeno (7d) < vajilla (10d) < pava (15d) < mesaLuz (20d) < sillon (30d)
    expect(body.items.map((i) => i.product_id)).toEqual([
      TEST_PRODUCT_IDS.espejo,
      TEST_PRODUCT_IDS.ajeno,
      TEST_PRODUCT_IDS.vajilla,
      TEST_PRODUCT_IDS.pava,
      TEST_PRODUCT_IDS.mesaLuz,
      TEST_PRODUCT_IDS.sillon,
    ]);
    expect(body.sort_by).toBe('created_at');
    expect(body.order).toBe('desc');
  });

  it('filtra por category_id', async () => {
    const { body } = await call(`?category_id=${TEST_CATEGORY_IDS.cocina}`);
    expect(body.total).toBe(3);
    const ids = body.items.map((i) => i.product_id).sort();
    expect(ids).toEqual(
      [TEST_PRODUCT_IDS.pava, TEST_PRODUCT_IDS.vajilla, TEST_PRODUCT_IDS.ajeno].sort(),
    );
  });

  it('filtra por seller_id (scopea al principal, excluye ajeno)', async () => {
    const { body } = await call(`?seller_id=${TEST_SELLER_ID}`);
    expect(body.total).toBe(5);
    expect(body.items.every((i) => i.seller_id === TEST_SELLER_ID)).toBe(true);
  });

  it('filtra por seller_id del otro seller (solo "ajeno")', async () => {
    const { body } = await call(`?seller_id=${TEST_OTHER_SELLER_ID}`);
    expect(body.total).toBe(1);
    expect(body.items[0]?.product_id).toBe(TEST_PRODUCT_IDS.ajeno);
  });

  it('filtra por condition=usado (solo el sillón)', async () => {
    const { body } = await call('?condition=usado');
    expect(body.total).toBe(1);
    expect(body.items[0]?.product_id).toBe(TEST_PRODUCT_IDS.sillon);
    expect(body.items[0]?.condition).toBe('usado');
  });

  it('filtra por condition=nuevo (5 productos)', async () => {
    const { body } = await call('?condition=nuevo');
    expect(body.total).toBe(5);
    expect(body.items.every((i) => i.condition === 'nuevo')).toBe(true);
  });

  it('condition=all (default) devuelve todo', async () => {
    const { body } = await call('?condition=all');
    expect(body.total).toBe(6);
  });

  it('filtra por rango de precio (min/max)', async () => {
    const { body } = await call('?min_price=20000&max_price=30000');
    // mesaLuz 24500 cae en el rango. sillon 89000 no. pava 19200 no. vajilla
    // 15600 no. espejo 16800 no. ajeno 1000 no.
    expect(body.total).toBe(1);
    expect(body.items[0]?.product_id).toBe(TEST_PRODUCT_IDS.mesaLuz);
  });

  it('búsqueda por texto en title (case-insensitive)', async () => {
    const { body } = await call('?q=Mesa');
    expect(body.total).toBe(1);
    expect(body.items[0]?.product_id).toBe(TEST_PRODUCT_IDS.mesaLuz);
  });

  it('sort_by=price&order=asc ordena por precio ascendente', async () => {
    const { body } = await call('?sort_by=price&order=asc');
    expect(body.items.map((i) => i.product_id)).toEqual([
      TEST_PRODUCT_IDS.ajeno,    // 1000
      TEST_PRODUCT_IDS.vajilla,  // 15600
      TEST_PRODUCT_IDS.espejo,   // 16800
      TEST_PRODUCT_IDS.pava,     // 19200
      TEST_PRODUCT_IDS.mesaLuz,  // 24500
      TEST_PRODUCT_IDS.sillon,   // 89000
    ]);
    expect(body.sort_by).toBe('price');
    expect(body.order).toBe('asc');
  });

  it('paginación: page_size=2 devuelve 2 items con total=6', async () => {
    const p1 = await call('?page=1&page_size=2&sort_by=price&order=asc');
    expect(p1.body.items).toHaveLength(2);
    expect(p1.body.total).toBe(6);
    expect(p1.body.page).toBe(1);
    expect(p1.body.page_size).toBe(2);
    expect(p1.body.items.map((i) => i.product_id)).toEqual([
      TEST_PRODUCT_IDS.ajeno,
      TEST_PRODUCT_IDS.vajilla,
    ]);

    const p2 = await call('?page=2&page_size=2&sort_by=price&order=asc');
    expect(p2.body.items.map((i) => i.product_id)).toEqual([
      TEST_PRODUCT_IDS.espejo,
      TEST_PRODUCT_IDS.pava,
    ]);
  });

  it('400 si los query params son inválidos (page=0)', async () => {
    const res = await invokeGet(GET, { url: `${BASE}?page=0`, headers: authHeader() });
    expect(res.status).toBe(400);
  });

  it('400 si page_size supera el máximo (>100)', async () => {
    const res = await invokeGet(GET, { url: `${BASE}?page_size=200`, headers: authHeader() });
    expect(res.status).toBe(400);
  });
});
