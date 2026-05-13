import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/ui/skeleton";
import { FieldSkeleton, PageHeaderSkeleton, SectionTitleSkeleton } from "./skeleton-parts";

export type ProductEditSkeletonProps = {
  mode?: "new" | "edit";
};

export function ProductEditSkeleton({ mode = "edit" }: ProductEditSkeletonProps) {
  return (
    <SkeletonRegion
      label={mode === "new" ? "Cargando formulario de producto" : "Cargando producto"}
    >
      <PageHeaderSkeleton withAction />
      <div className="p-4 pb-32 lgx:px-7 lgx:py-6">
        <div className="flex flex-col gap-4 min-[901px]:flex-row min-[901px]:items-start">
          <div className="contents min-[901px]:flex min-[901px]:flex-col min-[901px]:gap-4 min-[901px]:flex-1 min-[901px]:min-w-0">
            <Card padding={24} className="order-1 min-[901px]:order-none">
              <SectionTitleSkeleton width={140} />
              <div className="flex flex-col gap-3.5">
                <FieldSkeleton />
                <FieldSkeleton height={120} />
                <div className="grid grid-cols-1 gap-3 min-[600px]:grid-cols-2">
                  <FieldSkeleton />
                  <FieldSkeleton />
                </div>
              </div>
            </Card>

            <Card padding={24} className="order-3 min-[901px]:order-none">
              <SectionTitleSkeleton width={170} />
              <SkeletonText width={260} height={11} className="mb-3" />
              <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="aspect-square w-full"
                    rounded="r2"
                  />
                ))}
              </div>
            </Card>

            <Card padding={24} className="order-5 min-[901px]:order-none">
              <SectionTitleSkeleton width={160} />
              <div className="grid grid-cols-1 gap-3 min-[600px]:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <FieldSkeleton key={i} />
                ))}
              </div>
            </Card>
          </div>

          <div className="contents min-[901px]:flex min-[901px]:flex-col min-[901px]:gap-4 min-[901px]:basis-[320px] min-[901px]:max-w-[360px] min-[901px]:shrink-0">
            <Card padding={24} className="order-2 min-[901px]:order-none">
              <SectionTitleSkeleton width={140} />
              <SkeletonText width={260} height={11} className="mb-3" />
              <Skeleton className="aspect-square w-full" rounded="r2" />
            </Card>

            <Card padding={24} className="order-4 min-[901px]:order-none">
              <SectionTitleSkeleton width={140} />
              <div className="flex flex-col gap-3.5">
                <FieldSkeleton />
                <FieldSkeleton />
              </div>
            </Card>

            <Card padding={24} className="order-6 min-[901px]:order-none">
              <SectionTitleSkeleton width={88} />
              <div className="flex flex-col gap-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-[60px] w-full"
                    rounded="r2"
                  />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </SkeletonRegion>
  );
}
