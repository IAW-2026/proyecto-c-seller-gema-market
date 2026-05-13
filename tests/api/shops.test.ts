import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/seller/shops/[seller_id]/route';
import { invokeGet } from '@/tests/helpers/invoke';
import { authHeader } from '@/tests/helpers/auth';
import {
  TEST_SELLER_ID,
  TEST_OTHER_SELLER_ID,
  TEST_PRODUCT_IDS,
} from '@/tests/fixtures/seed';
import type { ShopResponse } from '@/lib/api/contracts/shops';

const url = (sellerId: string, query = '') =>
  `http://test/api/seller/shops/${sellerId}${query}`;

async function call(sellerId: string, query = '', auth = true) {
  return invokeGet(GET, {
    url: url(sellerId, query),
    headers: auth ? authHeader() : undefined,
    params: { seller_id: sellerId },
  });
}

describe('GET /api/seller/shops/:seller_id', () => {
  it('401 sin auth', async () => {
    const res = await call(TEST_SELLER_ID, '', false);
    expect(res.status).toBe(401);
  });

  it('404 si el seller no existe', async () => {
    const res = await call('usr_does_not_exist');
    expect(res.status).toBe(404);
  });

  it('200 devuelve el shop del seller principal con shape completa', async () => {
    const res = await call(TEST_SELLER_ID);
    expect(res.status).toBe(200);
    const body = (await res.json()) as ShopResponse;
    expect(body).toMatchObject({
      seller_id: TEST_SELLER_ID,
      shop_name: 'Carpintería Sur',
      bio: 'Taller de muebles a medida.',
      logo_url: expect.any(String),
      cover_url: expect.any(String),
      city: 'Bahía Blanca',
      total_products: 5,
    });
  });

  it('top-level expone exactamente las keys del contrato', async () => {
    const res = await call(TEST_SELLER_ID);
    const body = (await res.json()) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(
      [
        'seller_id',
        'shop_name',
        'bio',
        'logo_url',
        'cover_url',
        'city',
        'total_products',
        'categories',
        'products',
      ].sort(),
    );
  });

  it('total_products no cuenta paused ni soft-deleted', async () => {
    // Main seller tiene 7 productos en DB pero solo 5 visibles (cortina pausado,
    // lampara soft-deleted no entran).
    const res = await call(TEST_SELLER_ID);
    const body = (await res.json()) as ShopResponse;
    expect(body.total_products).toBe(5);
  });

  it('categories son las distintas de productos activos del seller, ordenadas por name', async () => {
    const res = await call(TEST_SELLER_ID);
    const body = (await res.json()) as ShopResponse;
    expect(body.categories.map((c) => c.name)).toEqual([
      'Cocina',
      'Dormitorio',
      'Living',
    ]);
    expect(Object.keys(body.categories[0]!).sort()).toEqual(['category_id', 'name']);
  });

  it('products.items NO incluye paused (cortina) ni soft-deleted (lampara)', async () => {
    const res = await call(TEST_SELLER_ID);
    const body = (await res.json()) as ShopResponse;
    const ids = body.products.items.map((p) => p.product_id);
    expect(ids).not.toContain(TEST_PRODUCT_IDS.cortina);
    expect(ids).not.toContain(TEST_PRODUCT_IDS.lampara);
  });

  it('products.items ordena created_at desc (más reciente primero)', async () => {
    const res = await call(TEST_SELLER_ID);
    const body = (await res.json()) as ShopResponse;
    expect(body.products.items.map((p) => p.product_id)).toEqual([
      TEST_PRODUCT_IDS.espejo,  // 5d
      TEST_PRODUCT_IDS.vajilla, // 10d
      TEST_PRODUCT_IDS.pava,    // 15d
      TEST_PRODUCT_IDS.mesaLuz, // 20d
      TEST_PRODUCT_IDS.sillon,  // 30d
    ]);
  });

  it('shop product item shape: sin seller_id, con href absoluto', async () => {
    const res = await call(TEST_SELLER_ID);
    const body = (await res.json()) as ShopResponse;
    const item = body.products.items[0]!;
    expect(Object.keys(item).sort()).toEqual(
      [
        'product_id',
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

  it('paginación: page_size=2 page=1 devuelve 2 items con total=5', async () => {
    const res = await call(TEST_SELLER_ID, '?page_size=2&page=1');
    const body = (await res.json()) as ShopResponse;
    expect(body.products.items).toHaveLength(2);
    expect(body.products.total).toBe(5);
    expect(body.products.page).toBe(1);
    expect(body.products.page_size).toBe(2);
    expect(body.products.items.map((p) => p.product_id)).toEqual([
      TEST_PRODUCT_IDS.espejo,
      TEST_PRODUCT_IDS.vajilla,
    ]);
  });

  it('paginación: page=3 page_size=2 devuelve la última página con 1 item', async () => {
    const res = await call(TEST_SELLER_ID, '?page_size=2&page=3');
    const body = (await res.json()) as ShopResponse;
    expect(body.products.items).toHaveLength(1);
    expect(body.products.items[0]?.product_id).toBe(TEST_PRODUCT_IDS.sillon);
  });

  it('shop products page solo tiene items/page/page_size/total (no sort_by/order)', async () => {
    const res = await call(TEST_SELLER_ID);
    const body = (await res.json()) as ShopResponse;
    expect(Object.keys(body.products).sort()).toEqual(
      ['items', 'page', 'page_size', 'total'].sort(),
    );
  });

  it('seller secundario devuelve sus propios datos (1 producto, 1 categoría)', async () => {
    const res = await call(TEST_OTHER_SELLER_ID);
    const body = (await res.json()) as ShopResponse;
    expect(body.seller_id).toBe(TEST_OTHER_SELLER_ID);
    expect(body.shop_name).toBe('Otro Shop');
    expect(body.total_products).toBe(1);
    expect(body.categories).toHaveLength(1);
    expect(body.categories[0]?.name).toBe('Cocina');
    expect(body.products.items).toHaveLength(1);
    expect(body.products.items[0]?.product_id).toBe(TEST_PRODUCT_IDS.ajeno);
  });

  it('seller secundario tiene bio/logo_url/cover_url null (no fueron seteados)', async () => {
    const res = await call(TEST_OTHER_SELLER_ID);
    const body = (await res.json()) as ShopResponse;
    expect(body.bio).toBeNull();
    expect(body.logo_url).toBeNull();
    expect(body.cover_url).toBeNull();
  });

  it('400 si los query params son inválidos (page=0)', async () => {
    const res = await invokeGet(GET, {
      url: url(TEST_SELLER_ID, '?page=0'),
      headers: authHeader(),
      params: { seller_id: TEST_SELLER_ID },
    });
    expect(res.status).toBe(400);
  });
});
