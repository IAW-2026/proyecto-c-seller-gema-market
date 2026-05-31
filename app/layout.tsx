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
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
