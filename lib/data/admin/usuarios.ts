import 'server-only';
import { prisma } from '@/lib/db';

// Vista consolidada de usuarios para el Control Plane. La tabla `Seller` es la
// caché local de identidad de Clerk de esta app, así que listarla equivale a
// listar los usuarios conocidos por la Seller App.
//
// `role` se infiere como 'seller' (el `seller_admin` real vive en Clerk
// `publicMetadata.role` y no se denormaliza acá — el Control Plane ya distingue
// `superadmin` por su cuenta). `fullName` vive en Clerk (first/last name) y no
// se persiste acá: va vacío. Paginación al estilo `listPublicProducts`.

export type AdminUsuarioRow = {
  id: string;
  clerkUserId: string;
  email: string;
  fullName: string;
  shopName: string;
  role: 'seller';
  suspended: boolean;
  createdAt: Date;
};

export type AdminUsuarioPage = {
  items: AdminUsuarioRow[];
  page: number;
  pageSize: number;
  total: number;
};

export async function listAdminUsuarios(
  filters: { page?: number; pageSize?: number } = {},
): Promise<AdminUsuarioPage> {
  const pageSize = filters.pageSize ?? 20;
  const requested = Math.max(1, Math.floor(filters.page ?? 1));

  const total = await prisma.seller.count();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requested, totalPages);
  const offset = (page - 1) * pageSize;

  const rows = await prisma.seller.findMany({
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: pageSize,
    select: {
      id: true,
      clerkUserId: true,
      email: true,
      shopName: true,
      suspended: true,
      createdAt: true,
    },
  });

  return {
    items: rows.map((r) => ({
      id: r.id,
      clerkUserId: r.clerkUserId,
      email: r.email,
      fullName: '',
      shopName: r.shopName,
      role: 'seller' as const,
      suspended: r.suspended,
      createdAt: r.createdAt,
    })),
    page,
    pageSize,
    total,
  };
}
