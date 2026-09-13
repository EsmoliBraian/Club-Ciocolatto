import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 px-4 pt-6">
      <Skeleton className="h-7 w-28" />
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-3.5 w-28" />
        </div>
        <Skeleton className="size-14 rounded-full" />
      </div>
      <div className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
