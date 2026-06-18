import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  findPublicProduct,
  findPublicProductsByIds,
  listPublicProducts,
} from '@/lib/data/public-products';
import { findPublicShop } from '@/lib/data/public-shop';
import { listAllProducts, setProductHidden } from '@/lib/data/admin/products';
import { listAllSellers, setSellerSuspended } from '@/lib/data/admin/sellers';
import {
  createCategory,
  deleteCategory,
  listCategoriesWithCounts,
  updateCategory,
} from '@/lib/data/admin/categories';
import { getAdminMetrics } from '@/lib/data/admin/metrics';
import { resetSeed } from '@/tests/helpers/seed-reset';
import {
  TEST_CATEGORY_IDS,
  TEST_OTHER_SELLER_ID,
  TEST_PRODUCT_IDS,
  TEST_SELLER_ID,
} from '@/tests/fixtures/seed';

// La fixture deja 6 productos visibles en el catálogo público (sillon, mesaLuz,
// pava, vajilla, espejo + ajeno de otro seller). cortina (paused) y lampara
// (soft-deleted) ya están excluidos por el seed.
const PUBLIC_VISIBLE_COUNT = 6;

beforeEach(async () => {
  await resetSeed();
});

// Restaura el estado canónico para los archivos de test que corran después.
afterAll(async () => {
  await resetSeed();
});

describe('moderación de productos (hiddenByAdmin)', () => {
  it('ocultar un producto lo excluye del catálogo público', async () => {
    const before = await listPublicProducts({});
    expect(before.total).toBe(PUBLIC_VISIBLE_COUNT);

    await setProductHidden(TEST_PRODUCT_IDS.sillon, true);

    const after = await listPublicProducts({});
    expect(after.total).toBe(PUBLIC_VISIBLE_COUNT - 1);
    expect(after.items.some((p) => p.productId === TEST_PRODUCT_IDS.sillon)).toBe(false);
  });

  it('un producto oculto devuelve null en el detalle público', async () => {
    await setProductHidden(TEST_PRODUCT_IDS.sillon, true);
    expect(await findPublicProduct(TEST_PRODUCT_IDS.sillon)).toBeNull();
  });

  it('un producto oculto se omite en el lookup batch', async () => {
    await setProductHidden(TEST_PRODUCT_IDS.sillon, true);
    const items = await findPublicProductsByIds([
      TEST_PRODUCT_IDS.sillon,
      TEST_PRODUCT_IDS.mesaLuz,
    ]);
    expect(items.map((i) => i.productId)).toEqual([TEST_PRODUCT_IDS.mesaLuz]);
  });

  it('mostrar de nuevo lo reincorpora al catálogo', async () => {
    await setProductHidden(TEST_PRODUCT_IDS.sillon, true);
    await setProductHidden(TEST_PRODUCT_IDS.sillon, false);
    const after = await listPublicProducts({});
    expect(after.total).toBe(PUBLIC_VISIBLE_COUNT);
  });

  it('setProductHidden devuelve el sellerId dueño', async () => {
    const { sellerId } = await setProductHidden(TEST_PRODUCT_IDS.sillon, true);
    expect(sellerId).toBe(TEST_SELLER_ID);
  });

  it('listAllProducts (admin) muestra el producto oculto y permite filtrar', async () => {
    await setProductHidden(TEST_PRODUCT_IDS.sillon, true);

    const all = await listAllProducts({ visibility: 'all', pageSize: 50 });
    const sillon = all.items.find((p) => p.id === TEST_PRODUCT_IDS.sillon);
    expect(sillon?.hiddenByAdmin).toBe(true);

    const hidden = await listAllProducts({ visibility: 'hidden', pageSize: 50 });
    expect(hidden.items.every((p) => p.hiddenByAdmin)).toBe(true);
    expect(hidden.items.some((p) => p.id === TEST_PRODUCT_IDS.sillon)).toBe(true);

    const visible = await listAllProducts({ visibility: 'visible', pageSize: 50 });
    expect(visible.items.some((p) => p.id === TEST_PRODUCT_IDS.sillon)).toBe(false);
  });
});

describe('moderación de tiendas (suspended)', () => {
  it('suspender un seller saca sus productos del catálogo público', async () => {
    await setSellerSuspended(TEST_SELLER_ID, true);

    const after = await listPublicProducts({});
    // Solo queda el producto del otro seller (no suspendido).
    expect(after.total).toBe(1);
    expect(after.items[0]?.sellerId).toBe(TEST_OTHER_SELLER_ID);
  });

  it('el shop público de un seller suspendido devuelve null (404)', async () => {
    await setSellerSuspended(TEST_SELLER_ID, true);
    expect(await findPublicShop(TEST_SELLER_ID)).toBeNull();
    // El otro seller sigue accesible.
    expect(await findPublicShop(TEST_OTHER_SELLER_ID)).not.toBeNull();
  });

  it('reactivar restaura el catálogo del seller', async () => {
    await setSellerSuspended(TEST_SELLER_ID, true);
    await setSellerSuspended(TEST_SELLER_ID, false);
    const after = await listPublicProducts({});
    expect(after.total).toBe(PUBLIC_VISIBLE_COUNT);
  });

  it('listAllSellers (admin) refleja el flag suspended', async () => {
    await setSellerSuspended(TEST_SELLER_ID, true);
    const sellers = await listAllSellers({ pageSize: 50 });
    const main = sellers.items.find((s) => s.id === TEST_SELLER_ID);
    expect(main?.suspended).toBe(true);
    expect(sellers.total).toBe(2);
  });
});

describe('CRUD de categorías (admin)', () => {
  it('crear una categoría la agrega al listado', async () => {
    const created = await createCategory('Jardín');
    const list = await listCategoriesWithCounts();
    expect(list.some((c) => c.id === created.id && c.name === 'Jardín')).toBe(true);
  });

  it('renombrar una categoría persiste el nuevo nombre', async () => {
    await updateCategory(TEST_CATEGORY_IDS.cocina, 'Cocina y Comedor');
    const list = await listCategoriesWithCounts();
    const cat = list.find((c) => c.id === TEST_CATEGORY_IDS.cocina);
    expect(cat?.name).toBe('Cocina y Comedor');
  });

  it('borrar una categoría sin productos la elimina', async () => {
    const created = await createCategory('Vacía');
    const res = await deleteCategory(created.id);
    expect(res.outcome).toBe('deleted');
    const list = await listCategoriesWithCounts();
    expect(list.some((c) => c.id === created.id)).toBe(false);
  });

  it('borrar una categoría con productos se bloquea (in_use)', async () => {
    // Living tiene productos (sillon, espejo, cortina, lampara).
    const res = await deleteCategory(TEST_CATEGORY_IDS.living);
    expect(res.outcome).toBe('in_use');
    if (res.outcome === 'in_use') {
      expect(res.productsCount).toBeGreaterThan(0);
    }
    const list = await listCategoriesWithCounts();
    expect(list.some((c) => c.id === TEST_CATEGORY_IDS.living)).toBe(true);
  });
});

describe('métricas del admin', () => {
  it('getAdminMetrics consolida totales del marketplace', async () => {
    const m = await getAdminMetrics();
    expect(m.sellers.total).toBe(2);
    expect(m.sellers.suspended).toBe(0);
    // Productos no soft-deleted: todos menos lampara.
    expect(m.products.total).toBe(7);
    expect(m.products.hidden).toBe(0);
    expect(m.sales.count).toBe(3);
    expect(m.sales.revenue).toBeGreaterThan(0);
    expect(m.topCategories.length).toBeGreaterThan(0);
  });
});
