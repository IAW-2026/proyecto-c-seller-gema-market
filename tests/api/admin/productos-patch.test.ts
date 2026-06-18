import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  GET as adminDetailGET,
  PATCH,
} from '@/app/api/seller/admin/productos/[product_id]/route';
import { GET as publicListGET } from '@/app/api/seller/productos/route';
import { GET as adminListGET } from '@/app/api/seller/admin/productos/route';
import { invokeGet, invokePatch } from '@/tests/helpers/invoke';
import { authHeader } from '@/tests/helpers/auth';
import { resetSeed } from '@/tests/helpers/seed-reset';
import { TEST_PRODUCT_IDS } from '@/tests/fixtures/seed';
import type { ProductListResponse } from '@/lib/api/contracts/products';
import type {
  AdminProductDetailResponse,
  AdminProductListResponse,
  AdminProductModerationResponse,
} from '@/lib/api/contracts/admin/products';

const PUBLIC = 'http://test/api/seller/productos';
const ADMIN = 'http://test/api/seller/admin/productos';

beforeEach(async () => {
  await resetSeed();
});

afterAll(async () => {
  await resetSeed();
});

async function publicIds(): Promise<string[]> {
  const res = await invokeGet(publicListGET, {
    url: `${PUBLIC}?page_size=100`,
    headers: authHeader(),
  });
  const body = (await res.json()) as ProductListResponse;
  return body.items.map((i) => i.product_id);
}

async function patch(
  productId: string,
  body: unknown,
  auth = true,
): Promise<Response> {
  return invokePatch(PATCH, {
    url: `${ADMIN}/${productId}`,
    body,
    headers: auth ? authHeader() : undefined,
    params: { product_id: productId },
  });
}

describe('GET /api/seller/admin/productos/:id (detalle admin)', () => {
  it('401 sin auth', async () => {
    const res = await invokeGet(adminDetailGET, {
      url: `${ADMIN}/${TEST_PRODUCT_IDS.cortina}`,
      params: { product_id: TEST_PRODUCT_IDS.cortina },
    });
    expect(res.status).toBe(401);
  });

  it('200 devuelve un producto paused (invisible al público) con sus flags', async () => {
    const res = await invokeGet(adminDetailGET, {
      url: `${ADMIN}/${TEST_PRODUCT_IDS.cortina}`,
      headers: authHeader(),
      params: { product_id: TEST_PRODUCT_IDS.cortina },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as AdminProductDetailResponse;
    expect(body.product_id).toBe(TEST_PRODUCT_IDS.cortina);
    expect(body.status).toBe('paused');
    expect(body.hidden_by_admin).toBe(false);
    expect(body.deleted_at).toBeNull();
    expect(Array.isArray(body.images)).toBe(true);
  });

  it('200 devuelve incluso un producto soft-deleted', async () => {
    const res = await invokeGet(adminDetailGET, {
      url: `${ADMIN}/${TEST_PRODUCT_IDS.lampara}`,
      headers: authHeader(),
      params: { product_id: TEST_PRODUCT_IDS.lampara },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as AdminProductDetailResponse;
    expect(body.deleted_at).not.toBeNull();
  });

  it('404 si el producto no existe', async () => {
    const res = await invokeGet(adminDetailGET, {
      url: `${ADMIN}/prd_inexistente`,
      headers: authHeader(),
      params: { product_id: 'prd_inexistente' },
    });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/seller/admin/productos/:id (moderación)', () => {
  it('401 sin auth', async () => {
    const res = await patch(TEST_PRODUCT_IDS.sillon, { hidden_by_admin: true }, false);
    expect(res.status).toBe(401);
  });

  it('ocultar un producto lo saca del catálogo público', async () => {
    expect(await publicIds()).toContain(TEST_PRODUCT_IDS.sillon);

    const res = await patch(TEST_PRODUCT_IDS.sillon, { hidden_by_admin: true });
    expect(res.status).toBe(200);
    const body = (await res.json()) as AdminProductModerationResponse;
    expect(body).toEqual({
      product_id: TEST_PRODUCT_IDS.sillon,
      status: 'active',
      hidden_by_admin: true,
    });

    expect(await publicIds()).not.toContain(TEST_PRODUCT_IDS.sillon);
  });

  it('pausar un producto lo saca del catálogo público', async () => {
    const res = await patch(TEST_PRODUCT_IDS.sillon, { status: 'paused' });
    expect(res.status).toBe(200);
    expect(await publicIds()).not.toContain(TEST_PRODUCT_IDS.sillon);
  });

  it('reactivar (status=active) lo reincorpora al catálogo', async () => {
    await patch(TEST_PRODUCT_IDS.cortina, { status: 'active' });
    expect(await publicIds()).toContain(TEST_PRODUCT_IDS.cortina);
  });

  it('un producto oculto aparece con hidden=true en el listado admin', async () => {
    await patch(TEST_PRODUCT_IDS.sillon, { hidden_by_admin: true });
    const res = await invokeGet(adminListGET, {
      url: `${ADMIN}?hidden=true&page_size=100`,
      headers: authHeader(),
    });
    const body = (await res.json()) as AdminProductListResponse;
    expect(body.items.every((i) => i.hidden_by_admin)).toBe(true);
    expect(body.items.some((i) => i.product_id === TEST_PRODUCT_IDS.sillon)).toBe(true);
  });

  it('400 si el body no trae nada para actualizar', async () => {
    const res = await patch(TEST_PRODUCT_IDS.sillon, {});
    expect(res.status).toBe(400);
  });

  it('404 si el producto no existe', async () => {
    const res = await patch('prd_inexistente', { status: 'paused' });
    expect(res.status).toBe(404);
  });
});
