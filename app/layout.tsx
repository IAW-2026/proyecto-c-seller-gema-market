import type { Metadata } from "next";
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
    <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
