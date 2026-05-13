import type { ProductInput } from "@/types/domain";

export type ProductFieldErrors = Partial<Record<keyof ProductInput, string>>;

const REQUIRED = "Este campo es obligatorio.";
const POSITIVE = "Tiene que ser mayor a 0.";
const STOCK_MIN = "Tiene que ser al menos 1.";

function isPositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

// Validador único compartido por cliente y server. El cliente lo usa para
// pintar errores por campo en el form; el server lo usa para rechazar inputs
// inválidos antes de tocar la DB.
export function validateProductInput(input: ProductInput): ProductFieldErrors {
  const errors: ProductFieldErrors = {};

  if (input.title.trim() === "") errors.title = REQUIRED;
  if (input.description.trim() === "") errors.description = REQUIRED;
  if (input.material.trim() === "") errors.material = REQUIRED;
  if (input.color.trim() === "") errors.color = REQUIRED;
  if (input.categoryId.trim() === "") errors.categoryId = REQUIRED;

  if (!isPositive(input.price)) errors.price = POSITIVE;
  if (!Number.isFinite(input.stock) || input.stock < 1) errors.stock = STOCK_MIN;
  if (!isPositive(input.weight)) errors.weight = POSITIVE;
  if (!isPositive(input.height)) errors.height = POSITIVE;
  if (!isPositive(input.width)) errors.width = POSITIVE;
  if (!isPositive(input.depth)) errors.depth = POSITIVE;

  if (!input.thumbnailUrl) errors.thumbnailUrl = "Subí una imagen principal.";
  if (input.images.length === 0) {
    errors.images = "Subí al menos una imagen de galería.";
  }

  return errors;
}

export function hasErrors(errors: ProductFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
