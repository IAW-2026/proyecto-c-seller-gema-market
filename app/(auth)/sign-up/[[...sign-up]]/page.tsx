import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/ui/branding";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-md lgx:max-w-2xl bg-paper border border-line rounded-r3 p-7 lgx:p-10 shadow-sm">
        <header className="mb-6 flex items-center gap-3">
          <Image
            src="/logo.png"
            alt={BRAND.platform}
            width={40}
            height={40}
            className="rounded-[12px] shrink-0"
            priority
          />
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
