import { Skeleton } from "@/components/Skeleton";

export default function SearchLoading() {
  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-gutter pt-md pb-xl flex flex-col gap-md">
      <section className="flex flex-col gap-sm">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </section>

      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {Array.from({ length: 6 }).map((_, i) => (
          <article
            key={i}
            className="border border-outline-variant rounded bg-surface-container-lowest p-md flex flex-col gap-sm"
          >
            <header className="flex items-start justify-between gap-sm">
              <div className="flex flex-col gap-xs flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton className="h-3 w-20" />
            </header>
            <div className="grid grid-cols-3 gap-xs">
              {Array.from({ length: 3 }).map((__, j) => (
                <div
                  key={j}
                  className="border border-outline-variant rounded p-sm flex flex-col gap-xs min-h-[120px]"
                >
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-3 w-16 mt-auto" />
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
