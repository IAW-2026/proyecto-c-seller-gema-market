// ─── Seller ────────────────────────────────────────────────────────────────

export type SellerAddress = {
  street: string;
  number: string;
  apartment?: string;
  postalCode: string;
};

// Forma de entrada para actualizar el perfil del vendedor.
export type SellerInput = {
  name: string;
  city: string;
  bio: string;
  email: string;
  phone: string;
  address: SellerAddress;
};

export type Seller = {
  id: string;
  name: string;
  city: string;
  bio: string;
  email: string;
  phone: string;
  address: SellerAddress;
  productsCount: number; // computado: count(producto) activos
  salesCount: number;    // computado: count(venta)
};
