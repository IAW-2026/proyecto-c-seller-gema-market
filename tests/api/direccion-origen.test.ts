import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/seller/productos/[product_id]/direccion-origen/route';
import { invokeGet } from '@/tests/helpers/invoke';
import { authHeader } from '@/tests/helpers/auth';
import { TEST_PRODUCT_IDS } from '@/tests/fixtures/seed';

const url = (id: string) =>
  `http://test/api/seller/productos/${id}/direccion-origen`;

async function call(id: string, auth = true) {
  return invokeGet(GET, {
    url: url(id),
    headers: auth ? authHeader() : undefined,
    params: { product_id: id },
  });
}

describe('GET /api/seller/productos/:product_id/direccion-origen', () => {
  it('401 sin auth', async () => {
    const res = await call(TEST_PRODUCT_IDS.sillon, false);
    expect(res.status).toBe(401);
  });

  it('200 devuelve la dirección de origen del vendedor del producto', async () => {
    const res = await call(TEST_PRODUCT_IDS.sillon);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      origin_address: { street: 'Av. Alem', number: '1200', zip: '8000' },
    });
  });

  it('origin_address solo expone street, number y zip', async () => {
    const res = await call(TEST_PRODUCT_IDS.sillon);
    const body = (await res.json()) as { origin_address: Record<string, unknown> };
    expect(Object.keys(body.origin_address).sort()).toEqual([
      'number',
      'street',
      'zip',
    ]);
  });

  it('200 con producto de otro seller → devuelve la dirección de ese seller', async () => {
    const res = await call(TEST_PRODUCT_IDS.ajeno);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      origin_address: { street: 'Otro', number: '1', zip: '2000' },
    });
  });

  // A diferencia del detalle público, este endpoint resuelve el origen aunque
  // el producto no sea visible: un envío en curso puede referenciar un producto
  // pausado o soft-deleted y la Shipping App igual necesita el punto de partida.
  it('200 aunque el producto esté paused (cortina) o soft-deleted (lampara)', async () => {
    const paused = await call(TEST_PRODUCT_IDS.cortina);
    const deleted = await call(TEST_PRODUCT_IDS.lampara);
    expect(paused.status).toBe(200);
    expect(deleted.status).toBe(200);
  });

  it('404 si el product_id no existe', async () => {
    const res = await call('prd_does_not_exist');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Not Found' });
  });
});
