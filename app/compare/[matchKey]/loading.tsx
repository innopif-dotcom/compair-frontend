import { Skeleton } from "@/components/Skeleton";

export default function CompareLoading() {
  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-gutter pt-md pb-xl flex flex-col gap-md">
      <Skeleton className="h-4 w-32" />

      <section className="flex flex-col gap-xs">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {Array.from({ length: 3 }).map((_, i) => (
          <article
            key={i}
            className="border border-outline-variant rounded bg-surface-container-lowest p-md flex flex-col gap-sm min-h-[280px]"
          >
            <header className="flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-16" />
            </header>
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-9 w-24" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-3 w-1/2 mt-auto" />
            <Skeleton className="h-4 w-1/2" />
          </article>
        ))}
      </section>
    </main>
  );
}
