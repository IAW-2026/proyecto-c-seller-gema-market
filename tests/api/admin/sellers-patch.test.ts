import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { GET as sellersListGET } from '@/app/api/seller/admin/sellers/route';
import { PATCH } from '@/app/api/seller/admin/sellers/[seller_id]/route';
import { GET as publicListGET } from '@/app/api/seller/productos/route';
import { invokeGet, invokePatch } from '@/tests/helpers/invoke';
import { authHeader } from '@/tests/helpers/auth';
import { resetSeed } from '@/tests/helpers/seed-reset';
import { TEST_SELLER_ID, TEST_OTHER_SELLER_ID } from '@/tests/fixtures/seed';
import type { ProductListResponse } from '@/lib/api/contracts/products';
import type {
  AdminSellerListResponse,
  AdminSellerSuspendResponse,
} from '@/lib/api/contracts/admin/sellers';

const SELLERS = 'http://test/api/seller/admin/sellers';
const PUBLIC = 'http://test/api/seller/productos';

beforeEach(async () => {
  await resetSeed();
});

afterAll(async () => {
  await resetSeed();
});

async function publicTotal(): Promise<number> {
  const res = await invokeGet(publicListGET, {
    url: `${PUBLIC}?page_size=100`,
    headers: authHeader(),
  });
  return ((await res.json()) as ProductListResponse).total;
}

async function patch(
  sellerId: string,
  body: unknown,
  auth = true,
): Promise<Response> {
  return invokePatch(PATCH, {
    url: `${SELLERS}/${sellerId}`,
    body,
    headers: auth ? authHeader() : undefined,
    params: { seller_id: sellerId },
  });
}

describe('GET /api/seller/admin/sellers', () => {
  it('401 sin auth', async () => {
    const res = await invokeGet(sellersListGET, { url: SELLERS });
    expect(res.status).toBe(401);
  });

  it('200 lista los 2 sellers con total_products (no borrados)', async () => {
    const res = await invokeGet(sellersListGET, {
      url: `${SELLERS}?page_size=100`,
      headers: authHeader(),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as AdminSellerListResponse;
    expect(body.total).toBe(2);
    const main = body.items.find((s) => s.seller_id === TEST_SELLER_ID);
    expect(main?.total_products).toBe(6); // excluye lampara soft-deleted
    const other = body.items.find((s) => s.seller_id === TEST_OTHER_SELLER_ID);
    expect(other?.total_products).toBe(1);
  });

  it('shape del item matchea el contrato', async () => {
    const res = await invokeGet(sellersListGET, { url: SELLERS, headers: authHeader() });
    const body = (await res.json()) as AdminSellerListResponse;
    expect(Object.keys(body.items[0]!).sort()).toEqual(
      [
        'seller_id', 'shop_name', 'email', 'phone', 'city',
        'suspended', 'total_products', 'created_at',
      ].sort(),
    );
  });

  it('filtra por suspended=true (ninguno en el seed)', async () => {
    const res = await invokeGet(sellersListGET, {
      url: `${SELLERS}?suspended=true`,
      headers: authHeader(),
    });
    const body = (await res.json()) as AdminSellerListResponse;
    expect(body.total).toBe(0);
  });
});

describe('PATCH /api/seller/admin/sellers/:id (suspensión)', () => {
  it('suspender un seller saca sus productos del catálogo público', async () => {
    const before = await publicTotal();
    expect(before).toBe(6);

    const res = await patch(TEST_SELLER_ID, { suspended: true });
    expect(res.status).toBe(200);
    const body = (await res.json()) as AdminSellerSuspendResponse;
    expect(body).toEqual({ seller_id: TEST_SELLER_ID, suspended: true });

    // Solo queda el producto del otro seller (no suspendido).
    expect(await publicTotal()).toBe(1);
  });

  it('reactivar restaura el catálogo del seller', async () => {
    await patch(TEST_SELLER_ID, { suspended: true });
    await patch(TEST_SELLER_ID, { suspended: false });
    expect(await publicTotal()).toBe(6);
  });

  it('401 sin auth', async () => {
    const res = await patch(TEST_SELLER_ID, { suspended: true }, false);
    expect(res.status).toBe(401);
  });

  it('400 si el body no trae suspended', async () => {
    const res = await patch(TEST_SELLER_ID, {});
    expect(res.status).toBe(400);
  });

  it('404 si el seller no existe', async () => {
    const res = await patch('usr_inexistente', { suspended: true });
    expect(res.status).toBe(404);
  });
});
