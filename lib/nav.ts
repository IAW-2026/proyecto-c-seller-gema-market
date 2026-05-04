import type { IconName } from "@/types/domain";

export type NavItem = {
  id: NavId;
  label: string;
  icon: IconName;
  href: string;
};

export type NavId = "dashboard" | "products" | "orders" | "stock" | "shop";

export const SELLER_NAV: ReadonlyArray<NavItem> = [
  { id: "dashboard", label: "Dashboard", icon: "chart", href: "/dashboard" },
  { id: "products", label: "Publicaciones", icon: "box", href: "/products" },
  { id: "orders", label: "Pedidos", icon: "cart", href: "/orders" },
  { id: "stock", label: "Stock", icon: "pkg", href: "/stock" },
  { id: "shop", label: "Mi tienda", icon: "tag", href: "/shop" },
];
