import { Skeleton } from "@/components/ui/skeleton";

/** Shared loading fallback for the "back header + list of cards" pages under /perfil. */
export function BackPageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-6">
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
