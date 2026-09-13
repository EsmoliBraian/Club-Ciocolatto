import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 px-4 pt-6">
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-border p-5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-lg" />
        <div className="grid grid-cols-3 gap-2 pt-1">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
