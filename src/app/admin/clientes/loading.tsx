import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
      <Skeleton className="h-9 w-full max-w-md rounded-lg" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
