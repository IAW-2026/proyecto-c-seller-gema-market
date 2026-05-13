import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/ui/skeleton";
import {
  PagerSkeleton,
  TabsSkeleton,
  TableSkeleton,
} from "./skeleton-parts";

const ORDERS_COLS = [
  { width: "32%" },
  { width: "22%" },
  { width: "14%" },
  { width: "14%" },
  { width: "14%", align: "right" as const },
  { width: "4%" },
];

export function OrdersSkeleton() {
  return (
    <SkeletonRegion label="Cargando pedidos">
      <TabsSkeleton count={4} />
      <div className="mt-4">
        <Card padding={0}>
          <TableSkeleton columns={ORDERS_COLS} rows={7} minWidth={760} />
          <div className="grid gap-3 p-3 lgx:hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-paper border border-line rounded-2xl p-3.5"
              >
                <div className="flex justify-between gap-2.5 items-start mb-3">
                  <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                    <SkeletonText width="75%" height={14} />
                    <SkeletonText width="55%" height={10} />
                  </div>
                  <Skeleton className="h-[18px] w-20 shrink-0" rounded="full" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 2 }).map((__, j) => (
                    <div key={j} className="bg-cream rounded-xl p-2.5">
                      <SkeletonText width={36} height={10} className="mb-1.5" />
                      <SkeletonText width={64} height={12} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <PagerSkeleton />
        </Card>
      </div>
    </SkeletonRegion>
  );
}
