import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
