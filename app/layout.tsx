import type { Metadata } from "next";
import { BRAND } from "@/lib/ui/branding";
import { SellerChrome } from "@/components/layout/seller-chrome";
import { getCurrentSeller } from "@/lib/auth/current-seller";
import { inter, jetbrainsMono } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${BRAND.platform} — ${BRAND.app}`,
    template: `%s · ${BRAND.platform} ${BRAND.app}`,
  },
  description: "Panel de vendedores de UniHousing",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const seller = await getCurrentSeller();
  return (
    <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <SellerChrome seller={seller}>{children}</SellerChrome>
      </body>
    </html>
  );
}
