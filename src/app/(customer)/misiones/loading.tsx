import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-8 w-full rounded-lg" />
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
