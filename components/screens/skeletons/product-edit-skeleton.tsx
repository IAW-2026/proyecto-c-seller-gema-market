import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
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
        <div className="grid gap-4 grid-cols-1 min-[901px]:grid-cols-[1fr_minmax(280px,360px)]">
          <div className="flex flex-col gap-4">
            <Card padding={24}>
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

            <Card padding={24}>
              <SectionTitleSkeleton width={120} />
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

            <Card padding={24}>
              <SectionTitleSkeleton width={160} />
              <div className="grid grid-cols-1 gap-3 min-[600px]:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <FieldSkeleton key={i} />
                ))}
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card padding={24}>
              <SectionTitleSkeleton width={140} />
              <div className="flex flex-col gap-3.5">
                <FieldSkeleton />
                <FieldSkeleton />
              </div>
            </Card>

            <Card padding={24}>
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
