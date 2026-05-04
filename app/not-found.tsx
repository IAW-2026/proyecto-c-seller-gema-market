import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-6">
      <div className="text-center max-w-[440px]">
        <div className="w-16 h-16 rounded-full bg-bone text-olive flex items-center justify-center mx-auto mb-5">
          <Icon name="alert" size={28} />
        </div>
        <div className="font-mono text-xs uppercase tracking-[0.1em] text-ink-3 mb-2">
          Error 404
        </div>
        <h1 className="m-0 mb-3 text-2xl font-semibold tracking-[-0.02em]">
          Página no encontrada
        </h1>
        <p className="m-0 mb-6 text-sm text-ink-3 leading-[1.5]">
          La sección que buscás no existe o fue movida.
        </p>
        <Link href="/dashboard">
          <Button variant="primary" icon="arrowLeft">
            Volver al dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
