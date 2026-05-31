import { Suspense, type ReactNode } from "react";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { BRAND } from "@/lib/ui/branding";
import { AdminNav } from "./admin-nav";

async function UserCardEmail() {
  const user = await currentUser();
  const email =
    user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  if (!email) return null;
  return (
    <div className="relative flex items-center gap-2.5 p-3 pointer-events-none">
      <div className="w-9 h-9 shrink-0" aria-hidden />
      <span className="flex-1 min-w-0 text-xs text-ink-2 truncate" title={email}>
        {email}
      </span>
    </div>
  );
}

export function AdminChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="hidden lgx:flex lgx:flex-col w-[240px] bg-paper border-r border-line px-3.5 py-5 shrink-0 sticky top-0 h-screen lgx:fixed lgx:left-0 lgx:top-0 lgx:bottom-0 lgx:z-[60]">
        <div className="px-1.5 pb-5 flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt={`${BRAND.platform} logo`}
            width={32}
            height={32}
            className="w-8 h-8 rounded-[10px]"
            priority
          />
          <div>
            <div className="text-sm font-semibold tracking-[-0.01em]">
              {BRAND.platform}
            </div>
            <div className="text-[10.5px] text-ink-3 font-mono">Admin</div>
          </div>
        </div>
        <Suspense><AdminNav variant="sidebar" /></Suspense>
        <div className="mt-auto relative bg-bone rounded-r2 min-w-0">
          <UserButton
            appearance={{
              elements: {
                rootBox: {
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                },
                userButtonTrigger: {
                  width: "100%",
                  height: "100%",
                  padding: "12px",
                  justifyContent: "flex-start",
                  borderRadius: "inherit",
                },
                avatarBox: { width: 36, height: 36, flexShrink: 0 },
              },
            }}
          />
          <Suspense fallback={null}><UserCardEmail /></Suspense>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col lgx:ml-[240px] lgx:w-[calc(100%-240px)]">
        {children}
      </main>

      <Suspense><AdminNav variant="bottom-tab" /></Suspense>
    </div>
  );
}
