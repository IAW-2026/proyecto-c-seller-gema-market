import { getSellerOrders } from "@/lib/data/orders";
import { countProductsByStatus } from "@/lib/data/products";
import type { Seller } from "@/types/domain";

type SellerSeed = Omit<Seller, "productsCount" | "salesCount">;

const SELLERS: ReadonlyArray<SellerSeed> = [
  {
    id: "s2",
    name: "Carpintería Sur",
    city: "Bahía Blanca",
    bio: "Taller de muebles a medida en Bahía Blanca. Trabajamos con maderas locales desde 2008.",
    email: "hola@carpinteriasur.com.ar",
    phone: "+54 291 412 5678",
    address: {
      street: "Av. Alem",
      number: "1200",
      postalCode: "8000",
    },
    verified: true,
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
    salesCount: getSellerOrders().length,
  };
}

export function getDefaultSeller(): Seller {
  const seller = findSeller("s2");

  if (!seller) {
    throw new Error("Default seller seed data is missing");
  }

  return seller;
}
