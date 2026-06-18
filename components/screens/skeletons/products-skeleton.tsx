import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/ui/skeleton";
import {
  PagerSkeleton,
  TabsSkeleton,
  TableSkeleton,
} from "./skeleton-parts";

const PRODUCTS_COLS = [
  { width: "40%" },
  { width: "14%" },
  { width: "12%" },
  { width: "12%" },
  { width: "14%" },
  { width: "8%", align: "right" as const },
];

export function ProductsSkeleton() {
  return (
    <SkeletonRegion label="Cargando publicaciones">
      <TabsSkeleton count={2} />
      <div className="mt-4">
        <Card padding={0}>
          <TableSkeleton columns={PRODUCTS_COLS} rows={6} minWidth={640} />
          <div className="grid gap-3 p-3 lgx:hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="relative bg-paper border border-line rounded-2xl p-3"
              >
                <div className="flex gap-3 items-center pr-10">
                  <Skeleton className="w-[52px] h-[52px] shrink-0" rounded="r2" />
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <SkeletonText width="65%" height={14} />
                    <SkeletonText width="80%" height={11} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {Array.from({ length: 3 }).map((__, j) => (
                    <div key={j} className="bg-cream rounded-xl p-2.5">
                      <SkeletonText width={42} height={10} className="mb-1.5" />
                      <SkeletonText width={56} height={13} />
                    </div>
                  ))}
                </div>
                <div className="absolute top-2.5 right-2.5">
                  <Skeleton className="h-8 w-8" rounded="full" />
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
