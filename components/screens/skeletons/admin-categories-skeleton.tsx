import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/ui/skeleton";

export function AdminCategoriesSkeleton() {
  return (
    <SkeletonRegion label="Cargando categorías">
      <Card className="mb-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
          <div className="flex-1">
            <Skeleton className="h-[46px] w-full" rounded="r2" />
          </div>
          <Skeleton className="h-[42px] w-28 shrink-0" rounded="full" />
        </div>
      </Card>

      <Card padding={0}>
        <ul className="divide-y divide-line">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 px-5 py-3.5">
              <SkeletonText width="35%" height={14} className="flex-1" />
              <Skeleton className="h-[18px] w-20 shrink-0" rounded="full" />
              <div className="flex gap-2 shrink-0">
                <Skeleton
                  className="h-[34px] w-9 lgx:w-20"
                  rounded="full"
                />
                <Skeleton
                  className="h-[34px] w-9 lgx:w-20"
                  rounded="full"
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </SkeletonRegion>
  );
}
