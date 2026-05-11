import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/ui/branding";
import { Icon } from "@/components/ui/icon";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-md bg-paper border border-line rounded-r3 p-7 shadow-sm">
        <header className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-cocoa text-paper flex items-center justify-center shrink-0">
            <Icon name="tag" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-[-0.01em] text-ink">
              Crear cuenta de {BRAND.app.toLowerCase()}
            </h1>
            <p className="text-[13px] text-ink-3 mt-0.5">
              Configurá tu tienda en {BRAND.platform}
            </p>
          </div>
        </header>

        <Suspense fallback={null}>
          <SignUpForm />
        </Suspense>

        <footer className="mt-6 pt-4 border-t border-line text-center">
          <span className="text-xs text-ink-3">¿Ya tenés cuenta? </span>
          <Link
            href="/sign-in"
            className="text-xs text-olive font-medium hover:underline underline-offset-2"
          >
            Iniciá sesión
          </Link>
        </footer>
      </div>
    </div>
  );
}
