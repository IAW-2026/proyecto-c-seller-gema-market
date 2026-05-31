// Smoke test del harness: verifica que el seed corrió y la DB de test tiene
// los datos esperados. Si esto pasa, el resto del pipeline (lib/api/*, helpers,
// invoke) está listo para usarse en los tests por endpoint.

import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/db';
import {
  TEST_SELLER_ID,
  TEST_CATEGORY_IDS,
  TEST_PRODUCT_IDS,
  TEST_SALES,
} from '@/tests/fixtures/seed';

describe('Fase 0 — harness smoke', () => {
  it('el seller principal existe', async () => {
    const seller = await prisma.seller.findUnique({ where: { id: TEST_SELLER_ID } });
    expect(seller).not.toBeNull();
    expect(seller?.shopName).toBe('Carpintería Sur');
  });

  it('hay 3 categorías', async () => {
    const cats = await prisma.categoria.findMany({ orderBy: { name: 'asc' } });
    expect(cats).toHaveLength(3);
    expect(cats.map((c) => c.id).sort()).toEqual(
      [TEST_CATEGORY_IDS.cocina, TEST_CATEGORY_IDS.dormitorio, TEST_CATEGORY_IDS.living].sort(),
    );
  });

  it('hay 8 productos (7 del seller principal + 1 ajeno)', async () => {
    const all = await prisma.product.count();
    expect(all).toBe(8);
    const mainSeller = await prisma.product.count({ where: { sellerId: TEST_SELLER_ID } });
    expect(mainSeller).toBe(7);
  });

  it('el producto soft-deleted tiene deletedAt seteado', async () => {
    const lampara = await prisma.product.findUnique({ where: { id: TEST_PRODUCT_IDS.lampara } });
    expect(lampara?.deletedAt).not.toBeNull();
  });

  it('hay 3 ventas con orderId determinístico', async () => {
    const sales = await prisma.sale.findMany({ orderBy: { orderId: 'asc' } });
    expect(sales.map((s) => s.orderId)).toEqual([
      TEST_SALES.paid,
      TEST_SALES.shipping,
      TEST_SALES.delivered,
    ]);
  });
});
