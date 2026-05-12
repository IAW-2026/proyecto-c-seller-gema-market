import 'server-only';
import { prisma } from '@/lib/db';
import { deleteImageByUrl, uploadImage } from '@/lib/storage/images';
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

// Sube la portada nueva, persiste la URL en Seller y borra la portada
// anterior del storage (best-effort). Lo mismo aplica a `uploadSellerLogo`.
// Estos uploads se persisten de forma autónoma — no esperan al "Guardar"
// general del form de /shop — para que cambiar la portada/logo sea una
// acción aislada con feedback inmediato.
async function replaceSellerImage(
  sellerId: string,
  file: File,
  column: 'coverUrl' | 'logoUrl',
  prefix: 'cover' | 'logo',
): Promise<string> {
  const existing = await prisma.seller.findUnique({
    where: { id: sellerId },
    select: { [column]: true } as { coverUrl: true } | { logoUrl: true },
  });
  if (!existing) throw new Error('Tienda no encontrada.');
  const oldUrl = (existing as Record<string, string | null>)[column];

  const newUrl = await uploadImage(file, `sellers/${sellerId}/${prefix}`);

  await prisma.seller.update({
    where: { id: sellerId },
    data: { [column]: newUrl },
  });

  await deleteImageByUrl(oldUrl);
  return newUrl;
}

export async function uploadSellerCover(
  sellerId: string,
  file: File,
): Promise<string> {
  return replaceSellerImage(sellerId, file, 'coverUrl', 'cover');
}

export async function uploadSellerLogo(
  sellerId: string,
  file: File,
): Promise<string> {
  return replaceSellerImage(sellerId, file, 'logoUrl', 'logo');
}
