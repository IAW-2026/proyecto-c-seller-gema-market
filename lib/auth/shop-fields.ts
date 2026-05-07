// Reglas de los campos que el seller carga al darse de alta. Vive separado
// de la action de onboarding porque también lo usa el form de sign-up
// (cliente) y la lectura de `unsafeMetadata` desde el server. Ningún
// "use server", ningún import server-only — es código puro reutilizable
// desde cualquier capa.

export type ShopFieldName =
  | "shopName"
  | "phone"
  | "city"
  | "street"
  | "number"
  | "postalCode"
  | "apartment";

type Rule = {
  label: string;
  min: number;
  max: number;
  optional?: true;
};

export const SHOP_FIELD_RULES: Record<ShopFieldName, Rule> = {
  shopName: { label: "Nombre de tienda", min: 2, max: 60 },
  phone: { label: "Teléfono", min: 6, max: 30 },
  city: { label: "Ciudad", min: 1, max: 80 },
  street: { label: "Calle", min: 1, max: 80 },
  number: { label: "Número", min: 1, max: 20 },
  postalCode: { label: "Código postal", min: 1, max: 15 },
  apartment: { label: "Depto", min: 0, max: 20, optional: true },
};

export type ShopFields = Partial<Record<ShopFieldName, string>>;
export type ShopFieldErrors = Partial<Record<ShopFieldName, string>>;

export function validateShopFields(values: ShopFields): ShopFieldErrors {
  const errors: ShopFieldErrors = {};
  for (const name of Object.keys(SHOP_FIELD_RULES) as ShopFieldName[]) {
    const rule = SHOP_FIELD_RULES[name];
    const v = (values[name] ?? "").trim();
    if (!v) {
      if (!rule.optional) errors[name] = `${rule.label} es obligatorio.`;
      continue;
    }
    if (v.length < rule.min) {
      errors[name] = `${rule.label} debe tener al menos ${rule.min} caracteres.`;
    } else if (v.length > rule.max) {
      errors[name] = `${rule.label} no puede superar ${rule.max} caracteres.`;
    }
  }
  return errors;
}

// Extrae los campos de tienda de un objeto opaco (típicamente
// `user.unsafeMetadata`). Devuelve solo strings ya trimmeados; descarta
// cualquier valor que no sea string. No valida — eso lo hace el caller.
export function parseShopFieldsFromMetadata(meta: unknown): ShopFields {
  if (!meta || typeof meta !== "object") return {};
  const source = meta as Record<string, unknown>;
  const out: ShopFields = {};
  for (const name of Object.keys(SHOP_FIELD_RULES) as ShopFieldName[]) {
    const v = source[name];
    if (typeof v === "string" && v.trim() !== "") out[name] = v.trim();
  }
  return out;
}
