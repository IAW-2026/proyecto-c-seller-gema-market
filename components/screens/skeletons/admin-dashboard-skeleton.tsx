import { Card } from "@/components/ui/card";
import { SkeletonRegion, SkeletonText } from "@/components/ui/skeleton";

export function AdminDashboardSkeleton() {
  return (
    <SkeletonRegion label="Cargando panel">
      <div className="grid grid-cols-2 lgx:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <SkeletonText width={88} height={11} className="mb-2" />
            <SkeletonText width={120} height={26} />
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <SkeletonText width={200} height={14} className="mb-3" />
        <Card padding={0}>
          <ul className="divide-y divide-line">
            {Array.from({ length: 5 }).map((_, i) => (
              <li
                key={i}
                className="flex items-center justify-between px-5 py-3"
              >
                <SkeletonText width="40%" height={13} />
                <SkeletonText width={28} height={13} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </SkeletonRegion>
  );
}
