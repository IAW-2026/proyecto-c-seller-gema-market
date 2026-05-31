import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/ui/skeleton";
import { PagerSkeleton, TableSkeleton } from "./skeleton-parts";

const SELLERS_COLS = [
  { width: "28%" },
  { width: "26%" },
  { width: "12%", align: "right" as const },
  { width: "10%", align: "right" as const },
  { width: "12%" },
  { width: "12%" },
];

export function AdminSellersSkeleton() {
  return (
    <SkeletonRegion label="Cargando tiendas">
      <Card padding={0}>
        <TableSkeleton columns={SELLERS_COLS} rows={6} minWidth={640} />
        <div className="grid gap-3 p-3 lgx:hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-paper border border-line rounded-2xl p-3"
            >
              <div className="flex justify-between gap-2.5 items-start mb-3">
                <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                  <SkeletonText width="60%" height={14} />
                  <SkeletonText width="80%" height={11} />
                </div>
                <Skeleton className="h-[18px] w-16 shrink-0" rounded="full" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 2 }).map((__, j) => (
                  <div key={j} className="bg-cream rounded-xl p-2.5">
                    <SkeletonText width={52} height={10} className="mb-1.5" />
                    <SkeletonText width={40} height={12} />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-end">
                <Skeleton className="h-[34px] w-32" rounded="full" />
              </div>
            </div>
          ))}
        </div>
        <PagerSkeleton />
      </Card>
    </SkeletonRegion>
  );
}
