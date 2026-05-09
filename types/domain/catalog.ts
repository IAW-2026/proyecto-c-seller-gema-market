// ─── Categoría ─────────────────────────────────────────────────────────────
//
// Refleja prisma `Categoria { id, name }`. El `name` es el label visible
// (ej. "Living", "Dormitorio") tal como lo escribe el seed.

export type Category = {
  id: string;   // ULID con prefijo cat_
  name: string; // label visible
};

// ─── Paginación (utilidad transversal) ─────────────────────────────────────

export type Page<T> = {
  items: ReadonlyArray<T>;
  total: number;
  page: number;
  pageSize: number;
};

export const PAGE_SIZES = [10, 20, 50] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 10;
