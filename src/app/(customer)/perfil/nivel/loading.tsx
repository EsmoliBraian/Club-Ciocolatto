import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 px-4 pt-6 pb-4">
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-6 w-52" />
      </div>
      <Skeleton className="h-4 w-full" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[86px] w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
