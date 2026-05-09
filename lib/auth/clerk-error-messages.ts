// Tabla de mensajes localizados (es-AR) para errores comunes de Clerk.
// El SDK devuelve los mensajes en inglés por default; este helper traduce los
// códigos más frecuentes y cae al `error.message` original si no conocemos el
// código.

type ClerkErrorLike = { code?: string | null; message?: string | null };

const MESSAGES: Record<string, string> = {
  form_identifier_not_found: "No encontramos una cuenta con ese email.",
  form_password_incorrect: "La contraseña es incorrecta.",
  form_password_pwned:
    "Esa contraseña apareció en filtraciones públicas. Probá con otra.",
  form_password_compromised:
    "Esa contraseña apareció en filtraciones públicas. Probá con otra.",
  form_password_validation_failed:
    "La contraseña no cumple los requisitos mínimos.",
  form_password_length_too_short:
    "La contraseña tiene que tener al menos 8 caracteres.",
  form_password_size_in_bytes_exceeded: "La contraseña es demasiado larga.",
  form_param_format_invalid: "El formato de uno de los campos no es válido.",
  form_param_nil: "Falta completar un campo obligatorio.",
  form_data_missing: "Falta completar un campo obligatorio.",
  form_identifier_exists: "Ya existe una cuenta con ese email.",
  form_code_incorrect: "El código de verificación no es correcto.",
  verification_expired:
    "El código expiró. Pedí uno nuevo y volvé a intentarlo.",
  too_many_requests:
    "Demasiados intentos. Esperá unos segundos y volvé a probar.",
};

export function clerkErrorMessage(
  err: ClerkErrorLike | null | undefined,
  fallback: string,
): string {
  if (!err) return fallback;
  const localized = err.code ? MESSAGES[err.code] : undefined;
  return localized ?? err.message ?? fallback;
}
