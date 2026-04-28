"use client";

import { useRouter, useSearchParams } from "next/navigation";

const SORTS: { key: string; label: string }[] = [
  { key: "relevance", label: "ความเกี่ยวข้อง" },
  { key: "price_asc", label: "ราคาต่ำ → สูง" },
  { key: "price_desc", label: "ราคาสูง → ต่ำ" },
  { key: "recent", label: "เห็นล่าสุด" }
];

export function SortBar() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params?.get("sort") ?? "relevance";

  function setSort(value: string) {
    const next = new URLSearchParams(params?.toString() ?? "");
    if (value === "relevance") next.delete("sort");
    else next.set("sort", value);
    next.delete("page");
    router.push(`/search?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-sm items-center">
      <span className="font-label-caps text-label-caps text-outline uppercase tracking-widest">
        Sort
      </span>
      {SORTS.map((sort) => {
        const active = current === sort.key;
        return (
          <button
            key={sort.key}
            onClick={() => setSort(sort.key)}
            className={`flex items-center gap-xs px-sm py-xs border rounded font-body-sm text-body-sm transition-colors ${
              active
                ? "bg-primary text-on-primary border-primary"
                : "bg-surface text-on-surface border-outline-variant hover:bg-surface-container"
            }`}
          >
            {sort.label}
          </button>
        );
      })}
    </div>
  );
}
