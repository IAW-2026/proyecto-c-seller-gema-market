import 'server-only';
import { prisma } from '@/lib/db';
import type { Seller, SellerInput } from "@/types/domain";

export async function findSeller(id: string): Promise<Seller | null> {
  return prisma.seller.findUnique({ where: { id } });
}

// Helper temporal: devuelve el primer seller de la DB.
// Reemplazar por lookup vía Clerk en la Fase 3 (auth).
export async function getDefaultSeller(): Promise<Seller> {
  const seller = await prisma.seller.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!seller) {
    throw new Error("getDefaultSeller: no hay sellers en la DB. Corré `npx prisma db seed`.");
  }
  return seller;
}

export async function saveSeller(input: SellerInput): Promise<Seller> {
  // TODO (Fase 2d): implementar con Prisma
  void input;
  throw new Error("saveSeller: backend no implementado aún");
}

export async function uploadSellerCover(file: File): Promise<string> {
  // TODO (Fase 3): subir el archivo a Vercel Blob.
  void file;
  throw new Error("uploadSellerCover: storage no configurado todavía");
}
