import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/seller/productos/[product_id]/route';
import { invokeGet } from '@/tests/helpers/invoke';
import { authHeader } from '@/tests/helpers/auth';
import { TEST_PRODUCT_IDS, TEST_SELLER_ID } from '@/tests/fixtures/seed';
import type { ProductDetailResponse } from '@/lib/api/contracts/products';

const url = (id: string) => `http://test/api/seller/productos/${id}`;

async function call(id: string, auth = true) {
  return invokeGet(GET, {
    url: url(id),
    headers: auth ? authHeader() : undefined,
    params: { product_id: id },
  });
}

describe('GET /api/seller/productos/:product_id', () => {
  it('401 sin auth', async () => {
    const res = await call(TEST_PRODUCT_IDS.sillon, false);
    expect(res.status).toBe(401);
  });

  it('200 devuelve el detalle del sillón con shape completa del contrato', async () => {
    const res = await call(TEST_PRODUCT_IDS.sillon);
    expect(res.status).toBe(200);
    const body = (await res.json()) as ProductDetailResponse;
    expect(body).toMatchObject({
      product_id: TEST_PRODUCT_IDS.sillon,
      seller: {
        seller_id: TEST_SELLER_ID,
        shop_name: 'Carpintería Sur',
        logo_url: expect.any(String),
      },
      title: 'Sillón de pana verde',
      description: 'Sillón usado en muy buen estado.',
      category_id: expect.any(String),
      category_name: 'Living',
      weight: 45,
      height: 90,
      width: 180,
      depth: 85,
      material: 'Pana',
      color: 'Verde',
      price: 89000,
      currency: 'ARS',
      stock: 5,
      condition: 'usado',
      images: expect.any(Array),
      created_at: expect.any(String),
    });
  });

  it('top-level solo expone las keys del contrato (no incluye campos extra)', async () => {
    const res = await call(TEST_PRODUCT_IDS.sillon);
    const body = (await res.json()) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(
      [
        'product_id',
        'seller',
        'title',
        'description',
        'category_id',
        'category_name',
        'weight',
        'height',
        'width',
        'depth',
        'material',
        'color',
        'price',
        'currency',
        'stock',
        'condition',
        'images',
        'created_at',
      ].sort(),
    );
  });

  it('seller anidado solo expone seller_id, shop_name, logo_url', async () => {
    const res = await call(TEST_PRODUCT_IDS.sillon);
    const body = (await res.json()) as ProductDetailResponse;
    expect(Object.keys(body.seller).sort()).toEqual(
      ['seller_id', 'shop_name', 'logo_url'].sort(),
    );
  });

  it('images[0] es el thumbnailUrl, después la galería', async () => {
    const res = await call(TEST_PRODUCT_IDS.sillon);
    const body = (await res.json()) as ProductDetailResponse;
    expect(body.images).toHaveLength(3);
    expect(body.images[0]).toContain('text=Product');   // PLACEHOLDER_THUMB
    expect(body.images[1]).toContain('text=Gallery1');
    expect(body.images[2]).toContain('text=Gallery2');
  });

  it('created_at es un ISO 8601 válido', async () => {
    const res = await call(TEST_PRODUCT_IDS.sillon);
    const body = (await res.json()) as ProductDetailResponse;
    expect(() => new Date(body.created_at).toISOString()).not.toThrow();
    expect(body.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('404 si el product_id no existe', async () => {
    const res = await call('prd_does_not_exist');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Not Found' });
  });

  it('404 si el producto está paused (cortina)', async () => {
    const res = await call(TEST_PRODUCT_IDS.cortina);
    expect(res.status).toBe(404);
  });

  it('404 si el producto está soft-deleted (lampara)', async () => {
    const res = await call(TEST_PRODUCT_IDS.lampara);
    expect(res.status).toBe(404);
  });

  it('200 con producto de otro seller (el endpoint es público, no scopea por seller)', async () => {
    const res = await call(TEST_PRODUCT_IDS.ajeno);
    expect(res.status).toBe(200);
    const body = (await res.json()) as ProductDetailResponse;
    expect(body.seller.seller_id).not.toBe(TEST_SELLER_ID);
  });

  it('condition refleja el valor de DB (usado para sillon, nuevo para mesaLuz)', async () => {
    const sillon = (await (await call(TEST_PRODUCT_IDS.sillon)).json()) as ProductDetailResponse;
    const mesa = (await (await call(TEST_PRODUCT_IDS.mesaLuz)).json()) as ProductDetailResponse;
    expect(sillon.condition).toBe('usado');
    expect(mesa.condition).toBe('nuevo');
  });
});
