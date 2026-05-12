import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export function ProductCreateFab() {
  return (
    <Link
      href="/products/new"
      aria-label="Nueva publicación"
      className="lgx:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-clay text-paper shadow-[0_8px_24px_rgba(0,0,0,0.18)] flex items-center justify-center active:scale-95 transition-transform"
    >
      <Icon name="plus" size={24} />
    </Link>
  );
}
