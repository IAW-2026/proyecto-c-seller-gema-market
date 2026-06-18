import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/seller/categorias/route';
import { invokeGet } from '@/tests/helpers/invoke';
import { authHeader } from '@/tests/helpers/auth';
import { TEST_CATEGORY_IDS } from '@/tests/fixtures/seed';
import type { CategoryListResponse } from '@/lib/api/contracts/categories';

const URL = 'http://test/api/seller/categorias';

describe('GET /api/seller/categorias', () => {
  it('401 sin header de auth', async () => {
    const res = await invokeGet(GET, { url: URL });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
  });

  it('401 con api key hash inválido', async () => {
    const res = await invokeGet(GET, {
      url: URL,
      headers: { 'x-api-key-hash': 'wrong-hash' },
    });
    expect(res.status).toBe(401);
  });

  it('200 devuelve las 3 categorías del seed con shape del contrato, ordenadas por name', async () => {
    const res = await invokeGet(GET, { url: URL, headers: authHeader() });
    expect(res.status).toBe(200);
    const body = (await res.json()) as CategoryListResponse;
    expect(body).toHaveLength(3);
    // Ordenadas por name asc: Cocina, Dormitorio, Living.
    expect(body).toEqual([
      { category_id: TEST_CATEGORY_IDS.cocina, name: 'Cocina' },
      { category_id: TEST_CATEGORY_IDS.dormitorio, name: 'Dormitorio' },
      { category_id: TEST_CATEGORY_IDS.living, name: 'Living' },
    ]);
  });

  it('cada item solo tiene category_id y name (no expone más campos)', async () => {
    const res = await invokeGet(GET, { url: URL, headers: authHeader() });
    const body = (await res.json()) as CategoryListResponse;
    for (const item of body) {
      expect(Object.keys(item).sort()).toEqual(['category_id', 'name']);
    }
  });
});
