"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  page: number;
  size: number;
  total: number;
}

export function Pagination({ page, size, total }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / size));

  function goto(target: number) {
    const next = new URLSearchParams(params?.toString() ?? "");
    if (target <= 1) next.delete("page");
    else next.set("page", String(target));
    router.push(`/search?${next.toString()}`);
  }

  return (
    <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
      <div>
        แสดงผล {(page - 1) * size + 1}–{Math.min(page * size, total)} จาก{" "}
        {total.toLocaleString("th-TH")} รายการ
      </div>
      <div className="flex items-center gap-xs">
        <button
          onClick={() => goto(page - 1)}
          disabled={page <= 1}
          className="px-sm py-xs border border-outline-variant rounded disabled:opacity-40 hover:bg-surface-container transition-colors"
        >
          ก่อนหน้า
        </button>
        <span className="px-sm">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => goto(page + 1)}
          disabled={page >= totalPages}
          className="px-sm py-xs border border-outline-variant rounded disabled:opacity-40 hover:bg-surface-container transition-colors"
        >
          ถัดไป
        </button>
      </div>
    </div>
  );
}
