export type CategoryInput = { name: string };

export type CategoryFieldErrors = Partial<Record<keyof CategoryInput, string>>;

const MIN = 2;
const MAX = 40;

// Validador compartido cliente/server del form de categorías. El server lo usa
// para rechazar inputs inválidos antes de tocar la DB (validación server-side).
export function validateCategoryInput(input: CategoryInput): CategoryFieldErrors {
  const errors: CategoryFieldErrors = {};
  const name = input.name.trim();
  if (name === '') {
    errors.name = 'Este campo es obligatorio.';
  } else if (name.length < MIN) {
    errors.name = `Tiene que tener al menos ${MIN} caracteres.`;
  } else if (name.length > MAX) {
    errors.name = `No puede superar los ${MAX} caracteres.`;
  }
  return errors;
}

export function hasErrors(errors: CategoryFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
