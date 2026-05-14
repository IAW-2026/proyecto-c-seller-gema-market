// Tipos del contrato HTTP para GET /api/seller/categorias.

export type CategoryItem = {
  category_id: string;
  name: string;
};

export type CategoryListResponse = CategoryItem[];
