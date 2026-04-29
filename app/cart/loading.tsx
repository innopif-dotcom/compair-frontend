import { Skeleton } from "@/components/Skeleton";

export default function CartLoading() {
  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-sm sm:px-gutter pt-md pb-xl flex flex-col gap-md">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </main>
  );
}
