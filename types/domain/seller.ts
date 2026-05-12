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
  // Imágenes públicas servidas desde Supabase Storage. El upload las persiste
  // de forma autónoma (botones "Cambiar portada/logo" en /shop), no a través
  // del save general del form — por eso no aparecen en `SellerInput`.
  coverUrl: string | null;
  logoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Vista enriquecida con agregaciones.
export type SellerWithCounts = Seller & {
  productsCount: number; // count(Product activos)
  salesCount: number;    // count(Sale)
};

// Forma de entrada del formulario de perfil de tienda (/shop).
//
// `email` se gestiona desde Clerk (`<UserButton />`) y no se edita acá.
// `phone` arranca con el valor de Clerk al crear el seller, pero después es
// independiente: el panel es la fuente de verdad para mostrarlo a los
// compradores (botón de WhatsApp, contacto, etc.).
export type SellerInput = {
  shopName: string;
  bio: string;
  phone: string;
  city: string;
  street: string;
  number: string;
  apartment?: string;
  postalCode: string;
};
