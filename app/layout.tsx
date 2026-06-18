import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { BRAND } from "@/lib/ui/branding";
import { inter, jetbrainsMono } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${BRAND.platform} — ${BRAND.app}`,
    template: `%s · ${BRAND.platform} ${BRAND.app}`,
  },
  description: "Panel de vendedores de UniHousing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Las imágenes (portadas, fotos de producto) se sirven desde Supabase Storage.
  // Preconectar el origen ahorra el handshake TLS cuando aparece la primera
  // imagen, que suele ser el elemento LCP. React 19 sube el <link> al <head>.
  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <body>
          {supabaseOrigin && <link rel="preconnect" href={supabaseOrigin} />}
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
