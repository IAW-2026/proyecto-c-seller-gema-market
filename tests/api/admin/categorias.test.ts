import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { GET, POST } from '@/app/api/seller/admin/categorias/route';
import { PATCH, DELETE } from '@/app/api/seller/admin/categorias/[id]/route';
import {
  invokeGet,
  invokePost,
  invokePatch,
  invokeDelete,
} from '@/tests/helpers/invoke';
import { authHeader } from '@/tests/helpers/auth';
import { resetSeed } from '@/tests/helpers/seed-reset';
import { TEST_CATEGORY_IDS } from '@/tests/fixtures/seed';
import type {
  AdminCategoryListResponse,
  AdminCategoryMutationResponse,
} from '@/lib/api/contracts/admin/categories';

const BASE = 'http://test/api/seller/admin/categorias';

beforeEach(async () => {
  await resetSeed();
});

afterAll(async () => {
  await resetSeed();
});

async function list(): Promise<AdminCategoryListResponse> {
  const res = await invokeGet(GET, { url: BASE, headers: authHeader() });
  return (await res.json()) as AdminCategoryListResponse;
}

describe('GET /api/seller/admin/categorias', () => {
  it('401 sin auth', async () => {
    const res = await invokeGet(GET, { url: BASE });
    expect(res.status).toBe(401);
  });

  it('200 lista las 3 categorías con product_count (no borrados), ordenadas por name', async () => {
    const body = await list();
    expect(body).toEqual([
      { category_id: TEST_CATEGORY_IDS.cocina, name: 'Cocina', product_count: 3 },
      { category_id: TEST_CATEGORY_IDS.dormitorio, name: 'Dormitorio', product_count: 1 },
      { category_id: TEST_CATEGORY_IDS.living, name: 'Living', product_count: 3 },
    ]);
  });
});

describe('POST /api/seller/admin/categorias', () => {
  it('201 crea una categoría nueva', async () => {
    const res = await invokePost(POST, {
      url: BASE,
      body: { name: 'Jardín' },
      headers: authHeader(),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as AdminCategoryMutationResponse;
    expect(body.name).toBe('Jardín');
    expect(body.category_id).toMatch(/^cat_/);
    expect((await list()).some((c) => c.category_id === body.category_id)).toBe(true);
  });

  it('409 si el nombre ya existe (case-insensitive)', async () => {
    const res = await invokePost(POST, {
      url: BASE,
      body: { name: 'cocina' },
      headers: authHeader(),
    });
    expect(res.status).toBe(409);
  });

  it('400 si el nombre está vacío', async () => {
    const res = await invokePost(POST, {
      url: BASE,
      body: { name: '   ' },
      headers: authHeader(),
    });
    expect(res.status).toBe(400);
  });

  it('401 sin auth', async () => {
    const res = await invokePost(POST, { url: BASE, body: { name: 'X' } });
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/seller/admin/categorias/:id', () => {
  it('200 renombra una categoría', async () => {
    const res = await invokePatch(PATCH, {
      url: `${BASE}/${TEST_CATEGORY_IDS.cocina}`,
      body: { name: 'Cocina y Comedor' },
      headers: authHeader(),
      params: { id: TEST_CATEGORY_IDS.cocina },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as AdminCategoryMutationResponse;
    expect(body).toEqual({
      category_id: TEST_CATEGORY_IDS.cocina,
      name: 'Cocina y Comedor',
    });
    expect((await list()).find((c) => c.category_id === TEST_CATEGORY_IDS.cocina)?.name)
      .toBe('Cocina y Comedor');
  });

  it('404 si la categoría no existe', async () => {
    const res = await invokePatch(PATCH, {
      url: `${BASE}/cat_inexistente`,
      body: { name: 'X' },
      headers: authHeader(),
      params: { id: 'cat_inexistente' },
    });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/seller/admin/categorias/:id', () => {
  it('200 borra una categoría sin productos', async () => {
    const created = (await (
      await invokePost(POST, { url: BASE, body: { name: 'Vacía' }, headers: authHeader() })
    ).json()) as AdminCategoryMutationResponse;

    const res = await invokeDelete(DELETE, {
      url: `${BASE}/${created.category_id}`,
      headers: authHeader(),
      params: { id: created.category_id },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect((await list()).some((c) => c.category_id === created.category_id)).toBe(false);
  });

  it('409 si la categoría tiene productos asociados', async () => {
    const res = await invokeDelete(DELETE, {
      url: `${BASE}/${TEST_CATEGORY_IDS.living}`,
      headers: authHeader(),
      params: { id: TEST_CATEGORY_IDS.living },
    });
    expect(res.status).toBe(409);
    expect((await list()).some((c) => c.category_id === TEST_CATEGORY_IDS.living)).toBe(true);
  });

  it('404 si la categoría no existe', async () => {
    const res = await invokeDelete(DELETE, {
      url: `${BASE}/cat_inexistente`,
      headers: authHeader(),
      params: { id: 'cat_inexistente' },
    });
    expect(res.status).toBe(404);
  });
});
