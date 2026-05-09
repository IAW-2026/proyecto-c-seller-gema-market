import type { useRouter } from "next/navigation";

// Tipo estructural mínimo que cubre tanto `signIn` como `signUp` del Future
// API de Clerk. Evita arrastrar imports de `@clerk/shared/types` y deja el
// helper agnóstico al recurso concreto.
type FinalizableResource = {
  finalize: (params?: {
    navigate: (ctx: {
      session?: { currentTask?: unknown } | null;
      decorateUrl: (url: string) => string;
    }) => void;
  }) => Promise<{ error: unknown }>;
};

// Centraliza la lógica de "completar el sign-in/sign-up y redirigir":
// si Clerk activa un session task obligatorio (ej. enroll MFA, reset
// password) la app no se mete: lo deja para que Clerk lo resuelva en su
// propio flujo y caemos a la home. Si no, redirige al destino pedido.
export function finalizeWithRedirect(
  resource: FinalizableResource,
  router: ReturnType<typeof useRouter>,
  redirectUrl: string,
) {
  return resource.finalize({
    navigate: ({ session, decorateUrl }) => {
      if (session?.currentTask) {
        router.push("/");
        return;
      }
      router.push(decorateUrl(redirectUrl));
    },
  });
}
