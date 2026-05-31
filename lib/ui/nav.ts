import type { IconName } from "@/types/ui";

export type NavItem = {
  id: NavId;
  label: string;
  icon: IconName;
  href: string;
};

export type NavId =
  | "dashboard"
  | "products"
  | "orders"
  | "stock"
  | "shop"
  | "admin-dashboard"
  | "admin-categorias"
  | "admin-sellers"
  | "admin-productos"
  | "admin-ventas";

export const SELLER_NAV: ReadonlyArray<NavItem> = [
  { id: "dashboard", label: "Dashboard", icon: "chart", href: "/dashboard" },
  { id: "products", label: "Publicaciones", icon: "box", href: "/products" },
  { id: "orders", label: "Pedidos", icon: "cart", href: "/orders" },
  { id: "stock", label: "Stock", icon: "pkg", href: "/stock" },
  { id: "shop", label: "Mi tienda", icon: "tag", href: "/shop" },
];

// Navegación del panel admin (rol `seller_admin`). El item raíz es `/admin`;
// el resto cuelga de él.
export const ADMIN_NAV: ReadonlyArray<NavItem> = [
  { id: "admin-dashboard", label: "Dashboard", icon: "chart", href: "/admin" },
  { id: "admin-categorias", label: "Categorías", icon: "grid", href: "/admin/categorias" },
  { id: "admin-sellers", label: "Tiendas", icon: "user", href: "/admin/sellers" },
  { id: "admin-productos", label: "Productos", icon: "box", href: "/admin/productos" },
  { id: "admin-ventas", label: "Ventas", icon: "cart", href: "/admin/ventas" },
];
