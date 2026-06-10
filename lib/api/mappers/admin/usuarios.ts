// Mapper domain → contract HTTP para GET /api/seller/admin/usuarios.

import type { AdminUsuarioPage, AdminUsuarioRow } from '@/lib/data/admin/usuarios';
import type {
  AdminUsuarioItem,
  AdminUsuarioListResponse,
} from '@/lib/api/contracts/admin/usuarios';

export function toAdminUsuarioItem(row: AdminUsuarioRow): AdminUsuarioItem {
  return {
    user_id: row.id,
    clerk_user_id: row.clerkUserId,
    email: row.email,
    full_name: row.fullName,
    shop_name: row.shopName,
    role: row.role,
    suspended: row.suspended,
    created_at: row.createdAt.toISOString(),
  };
}

export function toAdminUsuarioListResponse(
  page: AdminUsuarioPage,
): AdminUsuarioListResponse {
  return {
    items: page.items.map(toAdminUsuarioItem),
    page: page.page,
    page_size: page.pageSize,
    total: page.total,
  };
}
