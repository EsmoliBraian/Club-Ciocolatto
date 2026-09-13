import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 pt-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="size-10 rounded-full" />
      </div>
      <Skeleton className="h-56 w-full rounded-3xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    </div>
  );
}
