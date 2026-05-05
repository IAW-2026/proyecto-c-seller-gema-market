import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { BRAND } from "@/lib/ui/branding";
import { SELLER_NAV, type NavId } from "@/lib/ui/nav";
import type { Seller } from "@/types/domain";

export type SellerShellProps = {
  seller: Pick<Seller, "name">;
  activeNavId: NavId;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function SellerShell({
  seller,
  activeNavId,
  title,
  subtitle,
  action,
  children,
}: SellerShellProps) {
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
        <nav className="flex flex-col gap-0.5" aria-label="Navegación principal">
          {SELLER_NAV.map((item) => {
            const isActive = activeNavId === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left ${isActive ? "bg-bone text-cocoa font-semibold" : "bg-transparent text-ink-2 font-medium"}`}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/shop"
          className="mt-auto p-3 bg-bone rounded-r2 flex items-center gap-2.5 hover:bg-[#e8e2d9] transition-colors"
        >
          <Avatar name={seller.name} size={36} />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
              {seller.name}
            </div>
            <div className="text-[11px] text-ink-3">Vendedor</div>
          </div>
        </Link>
      </aside>

      <main
        className={`flex-1 min-w-0 flex flex-col lgx:ml-[240px] lgx:w-[calc(100%-240px)] pb-16 ${action ? "pb-32 lgx:pb-0" : "lgx:pb-0"}`}
      >
        <div className="block lgx:hidden">
          <div className="sticky top-0 z-30 bg-paper/95 backdrop-blur-[12px] px-4 border-b border-line flex items-center justify-between min-h-[52px]">
            <Link
              href="/"
              className="text-xs text-ink-3 flex items-center gap-1 shrink-0"
            >
              <Icon name="arrowLeft" size={14} /> Hub
            </Link>
            <div className="text-center flex-1 px-3 min-w-0">
              {subtitle && (
                <div className="text-[9.5px] font-mono text-ink-3 uppercase tracking-[0.1em] leading-none">
                  {subtitle}
                </div>
              )}
              <div className="text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                {title}
              </div>
            </div>
            <div className="w-12 shrink-0" />
          </div>
        </div>

        <header className="hidden lgx:flex bg-paper border-b border-line px-7 py-5 justify-between items-end gap-4 flex-wrap">
          <div>
            {subtitle && (
              <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-ink-3 mb-1">
                {subtitle}
              </div>
            )}
            <h1 className="m-0 text-[26px] font-semibold tracking-[-0.02em]">
              {title}
            </h1>
          </div>
          {action}
        </header>

        <div className="p-4 flex-1 lgx:px-7 lgx:py-6">{children}</div>
      </main>

      {action && (
        <div className="block lgx:hidden fixed bottom-16 left-0 right-0 z-[39] bg-paper/95 backdrop-blur-[12px] border-t border-line px-4 py-2.5 [&>div]:w-full [&>div]:flex [&>div]:gap-2 [&>button]:w-full [&_button]:flex-1 [&_button]:min-w-0 [&_button]:px-2.5">
          {action}
        </div>
      )}

      <nav
        className="flex lgx:hidden fixed bottom-0 left-0 right-0 bg-paper/95 backdrop-blur-[12px] border-t border-line justify-around px-1 pt-2 pb-3 z-40"
        aria-label="Navegación principal"
      >
        {SELLER_NAV.map((item) => {
          const isActive = activeNavId === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center gap-[3px] px-1 py-1.5 rounded-[10px] relative flex-1 min-w-0 ${isActive ? "text-cocoa" : "text-ink-3"}`}
            >
              <Icon name={item.icon} size={20} />
              <span className="text-[9px] font-medium max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 w-3.5 h-0.5 bg-cocoa rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
