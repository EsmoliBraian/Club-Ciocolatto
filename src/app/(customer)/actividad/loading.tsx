import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 px-4 pt-6">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
