export type CategoryId =
  | "living"
  | "dormitorio"
  | "comedor"
  | "cocina"
  | "bath"
  | "terraza"
  | "decoracion";

export type IconName =
  | "home"
  | "search"
  | "heart"
  | "cart"
  | "user"
  | "menu"
  | "close"
  | "chevronLeft"
  | "chevronRight"
  | "chevronDown"
  | "chevronUp"
  | "plus"
  | "minus"
  | "check"
  | "star"
  | "starFill"
  | "filter"
  | "truck"
  | "box"
  | "pkg"
  | "map"
  | "pin"
  | "clock"
  | "bell"
  | "settings"
  | "edit"
  | "trash"
  | "eye"
  | "sliders"
  | "arrowRight"
  | "arrowLeft"
  | "arrowUp"
  | "arrowDown"
  | "qr"
  | "creditCard"
  | "bank"
  | "copy"
  | "wallet"
  | "cash"
  | "shield"
  | "lock"
  | "info"
  | "alert"
  | "chat"
  | "chart"
  | "chartBar"
  | "pkgOut"
  | "refresh"
  | "download"
  | "print"
  | "phone"
  | "logout"
  | "upload"
  | "camera"
  | "image"
  | "tag"
  | "sparkle"
  | "leaf"
  | "moon"
  | "sun"
  | "bath"
  | "sofa"
  | "bed"
  | "chef"
  | "leafDeco"
  | "flower"
  | "moreH"
  | "moreV"
  | "grid"
  | "list"
  | "calendar"
  | "mail"
  | "flame"
  | "helmet"
  | "scan";

export type GlyphKind =
  | "bath"
  | "cocina"
  | "comedor"
  | "dormitorio"
  | "decoracion"
  | "living"
  | "terraza"
  | "box";

export type PillTone =
  | "neutral"
  | "sand"
  | "sage"
  | "forest"
  | "success"
  | "warn"
  | "danger"
  | "outline";

export type Palette = readonly [string, string];

export type Category = {
  id: CategoryId;
  name: string;
  icon: IconName;
};

export type Product = {
  id: string;
  title: string;
  price: number;
  oldPrice?: number;
  seller: string;
  sellerId: string;
  rating: number;
  reviews: number;
  category: CategoryId;
  glyph: GlyphKind;
  palette: Palette;
  stock: number;
  condition: string;
  location: string;
  shipping: number;
  dims: string;
  status: ProductStatus;
};

export type ProductStatus = "active" | "paused";

export type OrderStatus =
  | "pago_pendiente"
  | "preparando"
  | "listo_envio"
  | "en_camino"
  | "entregado"
  | "cancelado";

export type Order = {
  id: string;
  date: string;
  status: OrderStatus;
  items: number;
  total: number;
  buyer: string;
  address: string;
  trackId: string;
};

export type StatusMeta = {
  label: string;
  tone: PillTone;
};

export type SellerAddress = {
  street: string;
  number: string;
  apartment?: string;
  postalCode: string;
};

export type Seller = {
  id: string;
  name: string;
  city: string;
  bio: string;
  email: string;
  phone: string;
  address: SellerAddress;
  productsCount: number;
  salesCount: number;
  verified: boolean;
};
