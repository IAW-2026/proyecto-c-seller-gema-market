// ─── Seller ────────────────────────────────────────────────────────────────

export type SellerAddress = {
  street: string;
  number: string;
  apartment?: string;
  postalCode: string;
};

// Forma de entrada para actualizar el perfil del vendedor.
// fullName proviene de Clerk y no es editable desde este formulario.
export type SellerInput = {
  shopName: string;
  city: string;
  bio: string;
  email: string;
  phone: string;
  address: SellerAddress;
};

export type Seller = {
  id: string;
  fullName: string;   // nombre real del usuario — fuente: Clerk (sync)
  shopName: string;   // nombre de la tienda — editable por el vendedor
  city: string;
  bio: string;
  email: string;
  phone: string;
  address: SellerAddress;
  productsCount: number; // computado: count(producto) activos
  salesCount: number;    // computado: count(venta)
};
