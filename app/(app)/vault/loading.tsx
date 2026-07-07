import { Skeleton } from "@/components/ui/skeleton";

export default function VaultLoading() {
  return (
    <div>
      <div className="mb-8 space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-6 w-96" />
      </div>
      <Skeleton className="mb-4 h-13 max-w-xl" />
      <Skeleton className="mb-6 h-11 w-full max-w-2xl rounded-full" />
      <div className="grid gap-5 sm:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}
