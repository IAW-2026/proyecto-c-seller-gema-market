import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/ui/skeleton";
import {
  AvatarRowSkeleton,
  StatCardSkeleton,
  TableSkeleton,
} from "./skeleton-parts";

const RECENT_ORDERS_COLS = [
  { width: "34%" },
  { width: "22%" },
  { width: "16%" },
  { width: "14%" },
  { width: "14%", align: "right" as const },
];

export function DashboardSkeleton() {
  return (
    <SkeletonRegion label="Cargando dashboard">
      <div className="p-4 pb-32 lgx:px-7 lgx:py-6">
        <div className="grid gap-3.5 mb-6 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        <Card padding={24} className="mb-6">
          <SkeletonText width={140} height={15} className="mb-4" />
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 py-3 ${i < 4 ? "border-b border-line" : ""}`}
              >
                <SkeletonText width={18} height={11} />
                <Skeleton className="w-9 h-9 shrink-0" rounded="r1" />
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <SkeletonText width="55%" height={12} />
                  <SkeletonText width="30%" height={10} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card padding={0}>
          <div className="p-5 flex justify-between items-center border-b border-line">
            <SkeletonText width={150} height={15} />
            <Skeleton className="h-8 w-24" rounded="full" />
          </div>
          <TableSkeleton columns={RECENT_ORDERS_COLS} rows={5} minWidth={600} />
          <div className="grid gap-3 p-3 lgx:hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-paper border border-line rounded-2xl p-3.5"
              >
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex flex-col gap-1.5">
                    <SkeletonText width={84} height={10} />
                    <AvatarRowSkeleton />
                  </div>
                  <Skeleton className="h-6 w-20" rounded="full" />
                </div>
                <div className="flex justify-between items-center">
                  <SkeletonText width={80} height={11} />
                  <SkeletonText width={70} height={13} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </SkeletonRegion>
  );
}
