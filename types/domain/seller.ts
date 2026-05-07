// ─── Seller (cache de Clerk) ───────────────────────────────────────────────
//
// Refleja prisma `Seller` 1:1, con dirección plana (street, number, apartment,
// postalCode) tal como está en la tabla. Las agregaciones viven en
// `SellerWithCounts`.
//
// El nombre real del usuario (first_name/last_name) NO se persiste acá: vive
// en Clerk y se lee con `currentUser()` cuando la UI lo necesite.

export type SellerRole = "seller";

export type Seller = {
  id: string;
  clerkUserId: string;
  shopName: string;
  email: string;
  phone: string;
  bio: string | null;
  role: SellerRole;
  city: string;
  street: string;
  number: string;
  apartment: string | null;
  postalCode: string;
  createdAt: Date;
  updatedAt: Date;
};

// Vista enriquecida con agregaciones.
export type SellerWithCounts = Seller & {
  productsCount: number; // count(Product activos)
  salesCount: number;    // count(Sale)
};

// Forma de entrada del formulario de perfil de tienda (/shop).
export type SellerInput = {
  shopName: string;
  email: string;
  phone: string;
  bio: string;
  city: string;
  street: string;
  number: string;
  apartment?: string;
  postalCode: string;
};
