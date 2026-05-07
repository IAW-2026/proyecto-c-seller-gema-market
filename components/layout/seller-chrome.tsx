import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { BRAND } from "@/lib/ui/branding";
import { getCurrentSeller } from "@/lib/auth/current-seller";
import { SellerNav } from "./seller-nav";

async function SellerProfilePill() {
  const seller = await getCurrentSeller();
  return (
    <Link
      href="/shop"
      className="mt-auto p-3 bg-bone rounded-r2 flex items-center gap-2.5 hover:bg-[#e8e2d9] transition-colors"
    >
      <Avatar name={seller.shopName} size={36} />
      <div className="min-w-0">
        <div className="text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
          {seller.shopName}
        </div>
        <div className="text-[11px] text-ink-3">Vendedor</div>
      </div>
    </Link>
  );
}

export function SellerChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="hidden lgx:flex lgx:flex-col w-[240px] bg-paper border-r border-line px-3.5 py-5 shrink-0 sticky top-0 h-screen lgx:fixed lgx:left-0 lgx:top-0 lgx:bottom-0 lgx:z-[60]">
        <div className="px-1.5 pb-5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-cocoa text-paper flex items-center justify-center">
            <Icon name="tag" size={16} />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-[-0.01em]">
              {BRAND.platform}
            </div>
            <div className="text-[10.5px] text-ink-3 font-mono">{BRAND.app}</div>
          </div>
        </div>
        <Suspense><SellerNav variant="sidebar" /></Suspense>
        <Suspense><SellerProfilePill /></Suspense>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col lgx:ml-[240px] lgx:w-[calc(100%-240px)]">
        {children}
      </main>

      <Suspense><SellerNav variant="bottom-tab" /></Suspense>
    </div>
  );
}
