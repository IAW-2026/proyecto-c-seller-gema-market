import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/ui/skeleton";
import { PagerSkeleton, TableSkeleton } from "./skeleton-parts";

const STOCK_COLS = [
  { width: "54%" },
  { width: "14%", align: "center" as const },
  { width: "16%" },
  { width: "16%", align: "right" as const },
];

function StockStatCardSkeleton() {
  return (
    <Card padding={14}>
      <SkeletonText
        width={90}
        height={11}
        className="mb-2 lgx:hidden"
      />
      <SkeletonText
        width={110}
        height={11}
        className="hidden lgx:block mb-2"
      />
      <SkeletonText width={56} height={20} className="lgx:hidden" />
      <SkeletonText width={72} height={26} className="hidden lgx:block" />
    </Card>
  );
}

export function StockSkeleton() {
  return (
    <SkeletonRegion label="Cargando stock">
      <div className="grid gap-2 mb-6 grid-cols-3 lgx:gap-3.5 lgx:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
        {Array.from({ length: 3 }).map((_, i) => (
          <StockStatCardSkeleton key={i} />
        ))}
      </div>

      <Card padding={0}>
        <div className="p-5 border-b border-line flex justify-between items-center">
          <SkeletonText width={200} height={15} />
        </div>
        <TableSkeleton columns={STOCK_COLS} rows={6} minWidth={680} />
        <div className="grid gap-3 p-3 lgx:hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-paper border border-line rounded-2xl p-3.5"
            >
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="w-12 h-12 shrink-0" rounded="r1" />
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <SkeletonText width="70%" height={13} />
                  <SkeletonText width="40%" height={10} />
                </div>
                <Skeleton className="h-[18px] w-16 shrink-0" rounded="full" />
              </div>
              <div className="flex items-center justify-between bg-cream rounded-xl p-2.5">
                <div className="flex flex-col gap-1.5">
                  <SkeletonText width={36} height={10} />
                  <SkeletonText width={28} height={15} />
                </div>
                <Skeleton className="h-9 w-[140px]" rounded="full" />
              </div>
            </div>
          ))}
        </div>
        <PagerSkeleton />
      </Card>
    </SkeletonRegion>
  );
}
