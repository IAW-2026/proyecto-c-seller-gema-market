// CategoryId es el slug estable usado para visual mapping.
// El DB almacena un ULID en categoria.id; el data layer hace el JOIN
// y expone el slug en Product.category y Category.slug.
export type CategoryId =
  | "living"
  | "dormitorio"
  | "comedor"
  | "cocina"
  | "bath"
  | "terraza"
  | "decoracion";

export type Page<T> = {
  items: ReadonlyArray<T>;
  total: number;
  page: number;
  pageSize: number;
};

export const PAGE_SIZES = [10, 20, 50] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export type Category = {
  id: string;       // ULID en DB; mismo valor que slug en mock
  slug: CategoryId; // slug estable para visual mapping y formularios
  name: string;
};
