// Tipos del contrato HTTP para GET /api/seller/admin/usuarios.

export type AdminUsuarioItem = {
  user_id: string;
  clerk_user_id: string;
  email: string;
  full_name: string;
  shop_name: string;
  role: 'seller';
  suspended: boolean;
  created_at: string; // ISO 8601
};

export type AdminUsuarioListResponse = {
  items: AdminUsuarioItem[];
  page: number;
  page_size: number;
  total: number;
};
