import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 pt-10 text-center">
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-80 w-full max-w-xs rounded-3xl" />
    </div>
  );
}
