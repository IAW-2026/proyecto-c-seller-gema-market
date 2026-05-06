// ─── Seller (cache de Clerk) ───────────────────────────────────────────────
//
// Refleja prisma `Seller` 1:1, con dirección plana (street, number, apartment,
// postalCode) tal como está en la tabla. Las agregaciones viven en
// `SellerWithCounts`.

export type SellerRole = "seller";

export type Seller = {
  id: string;
  clerkUserId: string | null;
  fullName: string; // proviene de Clerk, no editable desde la app
  shopName: string;
  email: string;
  phone: string;
  bio: string | null;
  role: SellerRole;
  city: string;
  street: string;
  number: string;
  apartment?: string;
  postalCode: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
};

// Vista enriquecida con agregaciones.
export type SellerWithCounts = Seller & {
  productsCount: number; // count(Product activos)
  salesCount: number;    // count(Sale)
};

// Forma de entrada del formulario de perfil.
// fullName proviene de Clerk y no es editable desde este formulario.
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
