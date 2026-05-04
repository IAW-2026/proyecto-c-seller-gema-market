import type { Category } from "@/types/domain";

export const CATEGORIES: ReadonlyArray<Category> = [
  { id: "living",     slug: "living",     name: "Living" },
  { id: "dormitorio", slug: "dormitorio", name: "Dormitorio" },
  { id: "comedor",    slug: "comedor",    name: "Comedor" },
  { id: "cocina",     slug: "cocina",     name: "Cocina" },
  { id: "bath",       slug: "bath",       name: "Baño" },
  { id: "terraza",    slug: "terraza",    name: "Terraza" },
  { id: "decoracion", slug: "decoracion", name: "Decoración" },
];
