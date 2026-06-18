import type { ProductCondition } from '@/lib/api/contracts/products';

// Tipos del contrato HTTP para GET /api/seller/shops/:seller_id.

export type ShopCategoryItem = {
  category_id: string;
  name: string;
};

// El item de productos dentro del shop NO repite seller_id (ya está implícito
// en el wrapper) — diferencia clave con el listing global de /api/seller/productos.
export type ShopProductItem = {
  product_id: string;
  title: string;
  price: number;
  currency: string;
  category_id: string;
  condition: ProductCondition;
  thumbnail_url: string | null;
  href: string;
};

export type ShopProductsPage = {
  items: ShopProductItem[];
  page: number;
  page_size: number;
  total: number;
};

export type ShopResponse = {
  seller_id: string;
  shop_name: string;
  bio: string | null;
  logo_url: string | null;
  cover_url: string | null;
  city: string;
  total_products: number;
  categories: ShopCategoryItem[];
  products: ShopProductsPage;
};
