import { Skeleton } from "@/components/Skeleton";

export default function ProductLoading() {
  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-gutter pt-md pb-xl flex flex-col gap-md">
      <Skeleton className="h-4 w-32" />

      <section className="border border-outline-variant rounded bg-surface-container-lowest p-md flex flex-col gap-sm">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-4 w-1/3" />

        <div className="flex flex-wrap gap-md mt-sm">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-xs min-w-[140px]">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-sm">
          <div className="flex flex-col gap-xs">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-7 w-32" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-[280px] w-full" />
      </section>
    </main>
  );
}
