// Tipos del contrato HTTP para GET /api/seller/admin/ventas.

export type AdminSaleStatus = 'paid' | 'shipping' | 'delivered' | 'shipping_failed';
export type AdminSaleSortBy = 'created_at' | 'total';
export type AdminOrder = 'asc' | 'desc';

export type AdminSaleListItem = {
  venta_id: string;
  order_id: string;
  product_id: string;
  seller_id: string;
  buyer_id: string;
  buyer_name: string;
  amount: number; // Sale.total (monto), no la cantidad de unidades.
  fee: number;
  status: AdminSaleStatus;
  tracking_code: string | null;
  created_at: string; // ISO 8601
};

export type AdminSaleListResponse = {
  items: AdminSaleListItem[];
  page: number;
  page_size: number;
  total: number;
  sort_by: AdminSaleSortBy;
  order: AdminOrder;
};
