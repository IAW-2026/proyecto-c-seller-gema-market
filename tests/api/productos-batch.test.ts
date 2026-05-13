import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/seller/productos/batch/route';
import { invokePost } from '@/tests/helpers/invoke';
import { authHeader } from '@/tests/helpers/auth';
import { TEST_PRODUCT_IDS, TEST_SELLER_ID } from '@/tests/fixtures/seed';
import type { ProductBatchResponse } from '@/lib/api/contracts/products';

const URL = 'http://test/api/seller/productos/batch';

async function call(
  body: unknown,
  auth = true,
): Promise<{ status: number; body: ProductBatchResponse | { error: string } }> {
  const res = await invokePost(POST, {
    url: URL,
    body,
    headers: auth ? authHeader() : undefined,
  });
  return { status: res.status, body: await res.json() };
}

describe('POST /api/seller/productos/batch', () => {
  it('401 sin auth', async () => {
    const res = await invokePost(POST, { url: URL, body: { product_ids: ['x'] } });
    expect(res.status).toBe(401);
  });

  it('400 si no manda body', async () => {
    const res = await invokePost(POST, { url: URL, headers: authHeader() });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('product_ids is required and must be a non-empty array');
  });

  it('400 con product_ids ausente', async () => {
    const { status, body } = await call({});
    expect(status).toBe(400);
    expect((body as { error: string }).error).toBe(
      'product_ids is required and must be a non-empty array',
    );
  });

  it('400 con array vacío', async () => {
    const { status, body } = await call({ product_ids: [] });
    expect(status).toBe(400);
    expect((body as { error: string }).error).toBe(
      'product_ids is required and must be a non-empty array',
    );
  });

  it('400 con product_ids no-string (números)', async () => {
    const { status } = await call({ product_ids: [123] });
    expect(status).toBe(400);
  });

  it('200 con 3 IDs reales devuelve los 3 productos', async () => {
    const ids = [
      TEST_PRODUCT_IDS.sillon,
      TEST_PRODUCT_IDS.mesaLuz,
      TEST_PRODUCT_IDS.pava,
    ];
    const { status, body } = await call({ product_ids: ids });
    expect(status).toBe(200);
    const products = (body as ProductBatchResponse).products;
    expect(products).toHaveLength(3);
    expect(products.map((p) => p.product_id)).toEqual(ids);
  });

  it('preserva el orden de entrada de los product_ids', async () => {
    const ids = [
      TEST_PRODUCT_IDS.vajilla,
      TEST_PRODUCT_IDS.sillon,
      TEST_PRODUCT_IDS.mesaLuz,
    ];
    const { body } = await call({ product_ids: ids });
    expect((body as ProductBatchResponse).products.map((p) => p.product_id)).toEqual(ids);
  });

  it('omite IDs inexistentes (silencioso, devuelve solo los reales)', async () => {
    const { status, body } = await call({
      product_ids: [TEST_PRODUCT_IDS.sillon, 'prd_fake_1', TEST_PRODUCT_IDS.pava, 'prd_fake_2'],
    });
    expect(status).toBe(200);
    const products = (body as ProductBatchResponse).products;
    expect(products).toHaveLength(2);
    expect(products.map((p) => p.product_id)).toEqual([
      TEST_PRODUCT_IDS.sillon,
      TEST_PRODUCT_IDS.pava,
    ]);
  });

  it('omite productos pausados (cortina)', async () => {
    const { body } = await call({
      product_ids: [TEST_PRODUCT_IDS.sillon, TEST_PRODUCT_IDS.cortina],
    });
    const products = (body as ProductBatchResponse).products;
    expect(products).toHaveLength(1);
    expect(products[0]?.product_id).toBe(TEST_PRODUCT_IDS.sillon);
  });

  it('omite productos soft-deleted (lampara)', async () => {
    const { body } = await call({
      product_ids: [TEST_PRODUCT_IDS.lampara, TEST_PRODUCT_IDS.mesaLuz],
    });
    const products = (body as ProductBatchResponse).products;
    expect(products).toHaveLength(1);
    expect(products[0]?.product_id).toBe(TEST_PRODUCT_IDS.mesaLuz);
  });

  it('item shape: solo las keys del contrato (sin description, images, material, created_at)', async () => {
    const { body } = await call({ product_ids: [TEST_PRODUCT_IDS.sillon] });
    const item = (body as ProductBatchResponse).products[0]!;
    expect(Object.keys(item).sort()).toEqual(
      [
        'product_id',
        'seller',
        'title',
        'category_id',
        'price',
        'currency',
        'stock',
        'condition',
        'thumbnail_url',
        'weight',
        'height',
        'width',
        'depth',
      ].sort(),
    );
  });

  it('seller anidado tiene seller_id, shop_name, logo_url', async () => {
    const { body } = await call({ product_ids: [TEST_PRODUCT_IDS.sillon] });
    const item = (body as ProductBatchResponse).products[0]!;
    expect(item.seller).toMatchObject({
      seller_id: TEST_SELLER_ID,
      shop_name: 'Carpintería Sur',
      logo_url: expect.any(String),
    });
    expect(Object.keys(item.seller).sort()).toEqual(
      ['seller_id', 'shop_name', 'logo_url'].sort(),
    );
  });

  it('campos numéricos llegan como número (no string)', async () => {
    const { body } = await call({ product_ids: [TEST_PRODUCT_IDS.sillon] });
    const item = (body as ProductBatchResponse).products[0]!;
    expect(typeof item.price).toBe('number');
    expect(typeof item.stock).toBe('number');
    expect(typeof item.weight).toBe('number');
    expect(item.price).toBe(89000);
  });
});
