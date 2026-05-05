import 'server-only';
import { getActiveSellerOrders } from "@/lib/data/orders";
import { countProductsByStatus } from "@/lib/data/products";
import type { Seller, SellerInput } from "@/types/domain";

type SellerSeed = Omit<Seller, "productsCount" | "salesCount">;

const SELLERS: ReadonlyArray<SellerSeed> = [
  {
    id: "s2",
    fullName: "Ana García",
    shopName: "Carpintería Sur",
    city: "Bahía Blanca",
    bio: "Taller de muebles a medida en Bahía Blanca. Trabajamos con maderas locales desde 2008.",
    email: "hola@carpinteriasur.com.ar",
    phone: "+54 291 412 5678",
    address: {
      street: "Av. Alem",
      number: "1200",
      postalCode: "8000",
    },
  },
];

export function findSeller(id: string): Seller | undefined {
  const seller = SELLERS.find((item) => item.id === id);

  if (!seller) {
    return undefined;
  }

  return {
    ...seller,
    productsCount: countProductsByStatus().active,
    salesCount: getActiveSellerOrders().length,
  };
}

export function getDefaultSeller(): Seller {
  const seller = findSeller("s2");

  if (!seller) {
    throw new Error("Default seller seed data is missing");
  }

  return seller;
}

export async function saveSeller(input: SellerInput): Promise<Seller> {
  // TODO: implementar con Prisma
  // const seller = await requireSeller();
  // await prisma.seller.update({ where: { id: seller.id }, data: { ... } })
  void input;
  throw new Error("saveSeller: backend no implementado aún");
}

export async function uploadSellerCover(file: File): Promise<string> {
  // TODO: subir el archivo al storage y devolver la URL pública
  void file;
  throw new Error("uploadSellerCover: backend no implementado aún");
}
