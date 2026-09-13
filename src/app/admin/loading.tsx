import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 w-full rounded-xl lg:col-span-2" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}
