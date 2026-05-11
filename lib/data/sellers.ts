import 'server-only';
import { prisma } from '@/lib/db';
import type { Seller, SellerInput, SellerWithCounts } from "@/types/domain";

export async function findSeller(id: string): Promise<Seller | null> {
  return prisma.seller.findUnique({ where: { id } });
}

export async function findSellerWithCounts(
  id: string,
): Promise<SellerWithCounts | null> {
  const row = await prisma.seller.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          products: { where: { status: 'active' } },
          sales: true,
        },
      },
    },
  });
  if (!row) return null;
  const { _count, ...rest } = row;
  return { ...rest, productsCount: _count.products, salesCount: _count.sales };
}

export async function saveSeller(
  sellerId: string,
  input: SellerInput,
): Promise<Seller> {
  return prisma.seller.update({
    where: { id: sellerId },
    data: {
      shopName: input.shopName,
      bio: input.bio || null,
      phone: input.phone,
      city: input.city,
      street: input.street,
      number: input.number,
      apartment: input.apartment ?? null,
      postalCode: input.postalCode,
    },
  });
}

export async function uploadSellerCover(file: File): Promise<string> {
  // TODO (Fase 3): subir el archivo a Vercel Blob.
  void file;
  throw new Error("uploadSellerCover: storage no configurado todavía");
}
