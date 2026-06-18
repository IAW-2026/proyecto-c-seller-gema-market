// Tipos del contrato HTTP para el ABM admin de categorías.

// ─── GET /api/seller/admin/categorias ─────────────────────────────────────────

export type AdminCategoryItem = {
  category_id: string;
  name: string;
  product_count: number;
};

export type AdminCategoryListResponse = AdminCategoryItem[];

// ─── POST / PATCH /api/seller/admin/categorias ────────────────────────────────

export type AdminCategoryMutationResponse = {
  category_id: string;
  name: string;
};

// ─── DELETE /api/seller/admin/categorias/:id ──────────────────────────────────

export type AdminCategoryDeleteResponse = { ok: true };
