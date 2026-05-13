import "server-only";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { Category, ProductCondition } from "@/types/domain";

// Modelo elegido vía Vercel AI Gateway. Pasar el modelo como string
// "provider/model" activa el Gateway automáticamente (lee AI_GATEWAY_API_KEY).
// Si más adelante queremos cambiar de modelo, alcanza con tocar esta línea.
const MODEL_ID = "anthropic/claude-sonnet-4.6";

const MAX_IMAGES = 6;

// Schema de salida del LLM. Todos los campos son nullables: el modelo devuelve
// null cuando no puede inferir el valor desde las imágenes + título (en vez de
// inventar). La UI decide qué hacer con cada campo (aplicar o ignorar).
const draftSchema = z.object({
  description: z
    .string()
    .min(40)
    .max(600)
    .nullable()
    .describe(
      "Descripción del producto en español, 2-4 oraciones. Resalta material, estado y usos. Sin emojis ni listas.",
    ),
  material: z
    .string()
    .max(60)
    .nullable()
    .describe("Material principal visible (ej: 'madera de pino', 'metal y vidrio')."),
  color: z
    .string()
    .max(40)
    .nullable()
    .describe("Color predominante en lenguaje natural (ej: 'verde oliva')."),
  condition: z
    .enum(["nuevo", "usado"])
    .nullable()
    .describe("Condición visible en las fotos. Null si no se puede determinar."),
  suggestedCategoryId: z
    .string()
    .nullable()
    .describe(
      "ID exacto de la categoría más apropiada (debe coincidir con uno de los IDs provistos). Null si ninguna encaja.",
    ),
});

export type ProductDraft = {
  description: string | null;
  material: string | null;
  color: string | null;
  condition: ProductCondition | null;
  suggestedCategoryId: string | null;
};

export type GenerateProductDraftInput = {
  title: string;
  imageUrls: ReadonlyArray<string>;
  categories: ReadonlyArray<Category>;
};

function buildSystemPrompt(categories: ReadonlyArray<Category>): string {
  const categoryList = categories
    .map((c) => `- ${c.id}: ${c.name}`)
    .join("\n");
  return [
    "Sos un asistente que ayuda a vendedores de un marketplace a publicar productos.",
    "Recibís el título tentativo y fotos del producto. Tu tarea es completar campos del formulario inspeccionando las imágenes.",
    "Reglas:",
    "- Respondé siempre en español rioplatense neutro.",
    "- Si un campo no se puede inferir con confianza desde las imágenes, devolvé null en ese campo (no inventes).",
    "- La descripción debe ser corta (2-4 oraciones), informativa y natural. Sin emojis, sin bullets, sin frases vacías de marketing.",
    "- Para 'condition': 'nuevo' solo si las fotos sugieren producto sin uso; en caso contrario 'usado'. Si no es claro, null.",
    "- Para 'suggestedCategoryId' elegí un ID exacto de la lista. Si ninguna categoría encaja, devolvé null.",
    "",
    "Categorías disponibles (id: nombre):",
    categoryList,
  ].join("\n");
}

function capitalizeFirst(s: string | null): string | null {
  if (!s) return s;
  const trimmed = s.trim();
  if (!trimmed) return null;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function buildUserContent(
  title: string,
  imageUrls: ReadonlyArray<string>,
): Array<
  | { type: "text"; text: string }
  | { type: "image"; image: URL }
> {
  return [
    {
      type: "text",
      text: `Título tentativo del vendedor: "${title.trim()}".\n\nAnalizá las siguientes ${imageUrls.length} imagen(es) del producto y completá los campos del schema.`,
    },
    ...imageUrls.slice(0, MAX_IMAGES).map(
      (url) => ({ type: "image" as const, image: new URL(url) }),
    ),
  ];
}

export async function generateProductDraft({
  title,
  imageUrls,
  categories,
}: GenerateProductDraftInput): Promise<ProductDraft> {
  if (!title.trim()) {
    throw new Error("Falta el título del producto.");
  }
  if (imageUrls.length === 0) {
    throw new Error("Necesitás al menos una imagen para usar el asistente.");
  }

  const { output } = await generateText({
    model: MODEL_ID,
    output: Output.object({ schema: draftSchema }),
    maxOutputTokens: 600,
    messages: [
      { role: "system", content: buildSystemPrompt(categories) },
      { role: "user", content: buildUserContent(title, imageUrls) },
    ],
  });

  // Si el modelo sugirió una categoría inexistente, la descartamos en vez de
  // dejar que el frontend la aplique a ciegas.
  const validCategoryIds = new Set(categories.map((c) => c.id));
  const suggestedCategoryId =
    output.suggestedCategoryId && validCategoryIds.has(output.suggestedCategoryId)
      ? output.suggestedCategoryId
      : null;

  return {
    description: output.description,
    material: capitalizeFirst(output.material),
    color: capitalizeFirst(output.color),
    condition: output.condition,
    suggestedCategoryId,
  };
}
