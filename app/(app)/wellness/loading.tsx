import { Skeleton, CardSkeleton } from "@/components/ui/skeleton";

export default function WellnessLoading() {
  return (
    <div>
      <div className="mb-8 space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-6 w-96" />
      </div>
      <div className="space-y-6">
        <CardSkeleton rows={3} />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}
