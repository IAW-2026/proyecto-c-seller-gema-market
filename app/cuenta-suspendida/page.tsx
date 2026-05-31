import type { Metadata } from "next";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = { title: "Cuenta suspendida" };

// Pantalla que ve un seller cuya cuenta fue suspendida por un admin. El gate de
// `(seller)/layout.tsx` redirige acá. No hay forma de volver al panel hasta que
// el admin reactive la cuenta; solo se ofrece cerrar sesión.
export default function CuentaSuspendidaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-6">
      <div className="text-center max-w-[440px]">
        <div className="w-16 h-16 rounded-full bg-bone text-clay flex items-center justify-center mx-auto mb-5">
          <Icon name="alert" size={28} />
        </div>
        <div className="font-mono text-xs uppercase tracking-[0.1em] text-ink-3 mb-2">
          Cuenta suspendida
        </div>
        <h1 className="m-0 mb-3 text-2xl font-semibold tracking-[-0.02em]">
          Tu cuenta está suspendida
        </h1>
        <p className="m-0 mb-6 text-sm text-ink-3 leading-[1.5]">
          Un administrador suspendió tu tienda. Tus publicaciones no aparecen en
          el catálogo. Si creés que es un error, contactá al equipo de Gema
          Market.
        </p>
        <SignOutButton>
          <Button variant="secondary" icon="arrowLeft">
            Cerrar sesión
          </Button>
        </SignOutButton>
      </div>
    </div>
  );
}
