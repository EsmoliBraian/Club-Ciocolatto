import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-8 w-full rounded-lg" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
