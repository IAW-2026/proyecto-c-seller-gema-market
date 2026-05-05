import type {
  Page,
  PageSize,
  Product,
  ProductFilters,
  ProductInput,
  ProductStatus,
  StockSummary,
} from "@/types/domain";
import { PAGE_SIZES } from "@/types/domain";
import { PRODUCTS } from "./seed";

export const DEFAULT_PRODUCTS_PAGE_SIZE: PageSize = 10;

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
        case "price_asc":  return a.price - b.price;
        case "price_desc": return b.price - a.price;
        case "sales_asc":  return a.salesCount - b.salesCount;
        case "sales_desc": return b.salesCount - a.salesCount;
        case "stock_asc":  return a.stock - b.stock;
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
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, limit);
}

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export async function saveProduct(input: ProductInput): Promise<Product> {
  // TODO: implementar con Prisma
  // await prisma.producto.upsert({ where: { id: input.id ?? "" }, ... })
  void input;
  throw new Error("saveProduct: backend no implementado aún");
}

export async function updateProductStock(
  productId: string,
  stock: number,
): Promise<void> {
  // TODO: implementar con Prisma
  // await prisma.producto.update({ where: { id: productId }, data: { stock } })
  void productId;
  void stock;
  throw new Error("updateProductStock: backend no implementado aún");
}

export async function uploadProductImage(file: File): Promise<string> {
  // TODO: subir el archivo al storage (Vercel Blob, S3, etc.) y devolver la URL pública
  void file;
  throw new Error("uploadProductImage: backend no implementado aún");
}
