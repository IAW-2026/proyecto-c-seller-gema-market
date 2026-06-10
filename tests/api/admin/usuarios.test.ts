import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/seller/admin/usuarios/route';
import { invokeGet } from '@/tests/helpers/invoke';
import { authHeader } from '@/tests/helpers/auth';
import type { AdminUsuarioListResponse } from '@/lib/api/contracts/admin/usuarios';

const BASE = 'http://test/api/seller/admin/usuarios';

describe('GET /api/seller/admin/usuarios', () => {
  it('401 sin auth', async () => {
    const res = await invokeGet(GET, { url: BASE });
    expect(res.status).toBe(401);
  });

  it('200 lista los sellers como usuarios (caché de Clerk)', async () => {
    const res = await invokeGet(GET, { url: BASE, headers: authHeader() });
    expect(res.status).toBe(200);
    const body = (await res.json()) as AdminUsuarioListResponse;
    expect(body.total).toBe(2);
    expect(body.items).toHaveLength(2);
  });

  it('shape del item matchea el contrato (role inferido, full_name vacío)', async () => {
    const res = await invokeGet(GET, { url: BASE, headers: authHeader() });
    const body = (await res.json()) as AdminUsuarioListResponse;
    const item = body.items[0]!;
    expect(Object.keys(item).sort()).toEqual(
      [
        'user_id', 'clerk_user_id', 'email', 'full_name',
        'shop_name', 'role', 'suspended', 'created_at',
      ].sort(),
    );
    expect(item.role).toBe('seller');
    expect(item.full_name).toBe('');
  });
});
