import type { Page, PageSize, Product, ProductStatus } from "@/types/domain";
import { PAGE_SIZES } from "@/types/domain";

export const PRODUCTS: ReadonlyArray<Product> = [
  { id: "p1", title: "Sillón de pana 2 cuerpos", price: 89000, oldPrice: 110000, seller: "Hogar Pampeano", sellerId: "s1", rating: 4.8, reviews: 32, category: "living", glyph: "living", palette: ["#a4ac86", "#414833"], stock: 3, condition: "Usado · Como nuevo", location: "Bahía Blanca", shipping: 4500, dims: "180×85×90 cm", status: "active" },
  { id: "p2", title: "Mesa de luz roble", price: 24500, seller: "Carpintería Sur", sellerId: "s2", rating: 4.9, reviews: 71, category: "dormitorio", glyph: "dormitorio", palette: ["#936639", "#582f0e"], stock: 8, condition: "Nuevo", location: "Bahía Blanca", shipping: 2800, dims: "45×40×55 cm", status: "active" },
  { id: "p3", title: "Lámpara de pie mimbre", price: 18900, seller: "La Lámpara", sellerId: "s3", rating: 4.6, reviews: 18, category: "decoracion", glyph: "decoracion", palette: ["#b6ad90", "#7f4f24"], stock: 5, condition: "Nuevo", location: "Bahía Blanca", shipping: 2200, dims: "40×40×160 cm", status: "active" },
  { id: "p4", title: "Juego de sábanas king", price: 32000, seller: "Textil Hogar", sellerId: "s4", rating: 4.7, reviews: 124, category: "dormitorio", glyph: "dormitorio", palette: ["#c2c5aa", "#656d4a"], stock: 22, condition: "Nuevo", location: "Bahía Blanca", shipping: 1800, dims: "Varios", status: "active" },
  { id: "p5", title: "Set de vajilla 12 pzs", price: 15600, seller: "Cocina&Co", sellerId: "s5", rating: 4.5, reviews: 56, category: "cocina", glyph: "cocina", palette: ["#a68a64", "#414833"], stock: 14, condition: "Nuevo", location: "Bahía Blanca", shipping: 2100, dims: "12 piezas", status: "active" },
  { id: "p6", title: "Mesa redonda 4 personas", price: 67000, seller: "Carpintería Sur", sellerId: "s2", rating: 4.8, reviews: 41, category: "comedor", glyph: "comedor", palette: ["#7f4f24", "#582f0e"], stock: 2, condition: "Nuevo", location: "Bahía Blanca", shipping: 5200, dims: "Ø100×75 cm", status: "active" },
  { id: "p7", title: "Cortina de baño bambú", price: 8400, seller: "Casa Verde", sellerId: "s6", rating: 4.4, reviews: 22, category: "bath", glyph: "bath", palette: ["#a4ac86", "#333d29"], stock: 30, condition: "Nuevo", location: "Bahía Blanca", shipping: 1500, dims: "180×200 cm", status: "paused" },
  { id: "p8", title: "Reposera plegable lona", price: 22500, seller: "Patio&Jardín", sellerId: "s7", rating: 4.7, reviews: 38, category: "terraza", glyph: "terraza", palette: ["#656d4a", "#a68a64"], stock: 6, condition: "Nuevo", location: "Bahía Blanca", shipping: 2900, dims: "60×80×90 cm", status: "active" },
  { id: "p9", title: "Espejo redondo 60cm", price: 16800, seller: "La Lámpara", sellerId: "s3", rating: 4.6, reviews: 27, category: "decoracion", glyph: "decoracion", palette: ["#b6ad90", "#414833"], stock: 9, condition: "Nuevo", location: "Bahía Blanca", shipping: 2400, dims: "Ø60 cm", status: "active" },
  { id: "p10", title: "Estantería pino 4 niveles", price: 38900, seller: "Carpintería Sur", sellerId: "s2", rating: 4.9, reviews: 88, category: "living", glyph: "living", palette: ["#936639", "#7f4f24"], stock: 4, condition: "Nuevo", location: "Bahía Blanca", shipping: 3500, dims: "80×30×160 cm", status: "active" },
  { id: "p11", title: "Pava eléctrica 1.7L", price: 19200, seller: "Cocina&Co", sellerId: "s5", rating: 4.5, reviews: 102, category: "cocina", glyph: "cocina", palette: ["#a4ac86", "#414833"], stock: 18, condition: "Nuevo", location: "Bahía Blanca", shipping: 1900, dims: "1.7 L", status: "paused" },
  { id: "p12", title: "Almohadón lino crudo", price: 6800, seller: "Textil Hogar", sellerId: "s4", rating: 4.7, reviews: 65, category: "decoracion", glyph: "decoracion", palette: ["#b6ad90", "#a4ac86"], stock: 40, condition: "Nuevo", location: "Bahía Blanca", shipping: 1200, dims: "45×45 cm", status: "active" },
];

export type SortBy =
  | "price_asc"
  | "price_desc"
  | "sales_asc"
  | "sales_desc"
  | "stock_asc"
  | "stock_desc";

export type StockFilter = "all" | "low" | "out";

export type ProductFilters = {
  query?: string;
  status?: ProductStatus;
  sortBy?: SortBy;
  stockFilter?: StockFilter;
  page?: number;
  pageSize?: number;
};

export const DEFAULT_PRODUCTS_PAGE_SIZE: PageSize = 20;

function filterAndSortProducts(filters: ProductFilters): ReadonlyArray<Product> {
  const normalizedQuery = filters.query?.trim().toLowerCase();

  let result = PRODUCTS.filter((product) => {
    const matchesQuery = normalizedQuery
      ? product.title.toLowerCase().includes(normalizedQuery)
      : true;
    const matchesStatus = filters.status ? product.status === filters.status : true;
    const matchesStock =
      filters.stockFilter === "low"
        ? product.stock > 0 && product.stock < 5
        : filters.stockFilter === "out"
          ? product.stock === 0
          : true;
    return matchesQuery && matchesStatus && matchesStock;
  });

  if (filters.sortBy) {
    result = [...result].sort((a, b) => {
      switch (filters.sortBy) {
        case "price_asc": return a.price - b.price;
        case "price_desc": return b.price - a.price;
        case "sales_asc": return a.reviews - b.reviews;
        case "sales_desc": return b.reviews - a.reviews;
        case "stock_asc": return a.stock - b.stock;
        case "stock_desc": return b.stock - a.stock;
        default: return 0;
      }
    });
  }

  return result;
}

function resolvePageSize(value: number | undefined, fallback: PageSize): PageSize {
  return (PAGE_SIZES as ReadonlyArray<number>).includes(value ?? -1)
    ? (value as PageSize)
    : fallback;
}

export function listProducts(filters: ProductFilters = {}): Page<Product> {
  const all = filterAndSortProducts(filters);
  const total = all.length;
  const pageSize = resolvePageSize(filters.pageSize, DEFAULT_PRODUCTS_PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const requested = Math.max(1, Math.floor(filters.page ?? 1));
  const page = Math.min(requested, totalPages);
  const offset = (page - 1) * pageSize;
  const items = all.slice(offset, offset + pageSize);
  return { items, total, page, pageSize };
}

export function countProductsByStatus(): Record<ProductStatus, number> {
  return PRODUCTS.reduce<Record<ProductStatus, number>>(
    (counts, product) => ({
      ...counts,
      [product.status]: counts[product.status] + 1,
    }),
    { active: 0, paused: 0 },
  );
}

export type StockSummary = {
  totalUnits: number;
  activeSkus: number;
  outOfStock: number;
};

export function getStockSummary(): StockSummary {
  return PRODUCTS.reduce<StockSummary>(
    (acc, p) => ({
      totalUnits: acc.totalUnits + p.stock,
      activeSkus: acc.activeSkus + 1,
      outOfStock: acc.outOfStock + (p.stock === 0 ? 1 : 0),
    }),
    { totalUnits: 0, activeSkus: 0, outOfStock: 0 },
  );
}

export function getTopProducts(limit: number): ReadonlyArray<Product> {
  return [...PRODUCTS]
    .sort((a, b) => b.reviews - a.reviews)
    .slice(0, limit);
}

export function getProductStaticParams(): Array<{ id: string }> {
  return PRODUCTS.map((product) => ({ id: product.id }));
}

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function listProductsForOrder(items: number): ReadonlyArray<Product> {
  return filterAndSortProducts({ status: "active" }).slice(0, items);
}
