"use client";

import { useClerk } from "@clerk/nextjs";

// Botón de "Cerrar sesión" custom. No usamos `<SignOutButton>` porque su
// `React.Children.only()` interno rompe cuando el wrapper se renderiza desde
// un Server Component (los nodos de texto del RSC payload cuentan como hijos
// extra y dispara "multiple children components").
export function SignOutLink() {
  const { signOut } = useClerk();
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: "/" })}
      className="text-xs text-ink-3 hover:text-ink underline-offset-2 hover:underline cursor-pointer"
    >
      Cerrar sesión
    </button>
  );
}
