import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/ui/skeleton";
import {
  PagerSkeleton,
  StatCardSkeleton,
  TableSkeleton,
} from "./skeleton-parts";

const STOCK_COLS = [
  { width: "54%" },
  { width: "14%", align: "center" as const },
  { width: "16%" },
  { width: "16%", align: "right" as const },
];

export function StockSkeleton() {
  return (
    <SkeletonRegion label="Cargando stock">
      <div className="grid gap-3.5 mb-6 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
        {Array.from({ length: 3 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <Card padding={0}>
        <div className="p-5 border-b border-line">
          <SkeletonText width={200} height={15} />
        </div>
        <TableSkeleton columns={STOCK_COLS} rows={6} minWidth={760} />
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
                <Skeleton className="h-6 w-20 shrink-0" rounded="full" />
              </div>
              <div className="flex items-center justify-between bg-cream rounded-xl p-2.5">
                <div className="flex flex-col gap-1.5">
                  <SkeletonText width={48} height={9} />
                  <SkeletonText width={36} height={15} />
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
