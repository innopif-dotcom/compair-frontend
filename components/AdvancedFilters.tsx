"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal
} from "lucide-react";

type Vendor = "msk" | "somsak" | "sor";
type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "unknown";

const VENDORS: { key: Vendor; label: string }[] = [
  { key: "msk", label: "MSK" },
  { key: "somsak", label: "Somsak" },
  { key: "sor", label: "SOR" }
];

const STOCK_STATUSES: { key: StockStatus; label: string }[] = [
  { key: "in_stock", label: "มีสินค้า" },
  { key: "low_stock", label: "เหลือน้อย" },
  { key: "out_of_stock", label: "หมด" }
];

const SORTS: { key: string; label: string }[] = [
  { key: "", label: "ความเกี่ยวข้อง" },
  { key: "price_asc", label: "ราคาต่ำ → สูง" },
  { key: "price_desc", label: "ราคาสูง → ต่ำ" },
  { key: "savings", label: "ส่วนต่างราคามากสุด" }
];

interface Props {
  defaultExpanded?: boolean;
}

export function AdvancedFilters({ defaultExpanded = false }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const readList = (key: string): string[] =>
    (params?.get(key) ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const readString = (key: string): string => params?.get(key) ?? "";
  const readBool = (key: string): boolean => params?.get(key) === "1";

  function update(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params?.toString() ?? "");
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    next.delete("page");
    router.push(`/search${next.toString() ? `?${next.toString()}` : ""}`);
  }

  function toggleList(key: string, value: string) {
    const current = readList(key);
    const updated = current.includes(value)
      ? current.filter((x) => x !== value)
      : [...current, value];
    update({ [key]: updated.length ? updated.join(",") : null });
  }

  function reset() {
    const next = new URLSearchParams();
    const q = params?.get("q");
    if (q) next.set("q", q);
    router.push(`/search${q ? `?${next.toString()}` : ""}`);
  }

  const activeCount = (() => {
    let n = 0;
    if (readList("vendor").length) n++;
    if (readList("stock").length) n++;
    if (readString("priceMin") || readString("priceMax")) n++;
    if (readString("sort")) n++;
    if (readBool("exact")) n++;
    if (readBool("full")) n++;
    return n;
  })();

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex items-center gap-sm flex-wrap">
        <button
          onClick={() => setExpanded((v) => !v)}
          type="button"
          className="inline-flex items-center gap-xs px-sm py-xs border border-outline-variant rounded text-body-sm text-on-surface hover:bg-surface-container transition-colors"
          aria-expanded={expanded}
        >
          <SlidersHorizontal className="h-4 w-4" />
          ตัวกรองขั้นสูง
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-on-primary text-[10px] font-mono">
              {activeCount}
            </span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {activeCount > 0 && (
          <button
            onClick={reset}
            type="button"
            className="inline-flex items-center gap-xs text-body-sm text-on-surface-variant hover:text-error transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {expanded && (
        <div className="border border-outline-variant rounded p-md grid grid-cols-1 md:grid-cols-2 gap-md bg-surface-container-lowest animate-fade-in">
          <FilterGroup label="ร้าน">
            <div className="flex flex-wrap gap-xs">
              {VENDORS.map((v) => (
                <CheckChip
                  key={v.key}
                  label={v.label}
                  checked={readList("vendor").includes(v.key)}
                  onChange={() => toggleList("vendor", v.key)}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="สถานะสต๊อก">
            <div className="flex flex-wrap gap-xs">
              {STOCK_STATUSES.map((s) => (
                <CheckChip
                  key={s.key}
                  label={s.label}
                  checked={readList("stock").includes(s.key)}
                  onChange={() => toggleList("stock", s.key)}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="ช่วงราคา (บาท)">
            <div className="flex items-center gap-xs">
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="ต่ำสุด"
                defaultValue={readString("priceMin")}
                onBlur={(e) => update({ priceMin: e.target.value || null })}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    update({ priceMin: (e.target as HTMLInputElement).value || null });
                }}
                className="w-24 px-sm py-xs border border-outline-variant rounded text-body-sm bg-surface focus:outline-none focus:border-primary"
              />
              <span className="text-on-surface-variant">–</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="สูงสุด"
                defaultValue={readString("priceMax")}
                onBlur={(e) => update({ priceMax: e.target.value || null })}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    update({ priceMax: (e.target as HTMLInputElement).value || null });
                }}
                className="w-24 px-sm py-xs border border-outline-variant rounded text-body-sm bg-surface focus:outline-none focus:border-primary"
              />
              <span className="text-[11px] text-on-surface-variant">
                (กด Enter หรือคลิกออกเพื่อใช้)
              </span>
            </div>
          </FilterGroup>

          <FilterGroup label="จัดเรียงตาม">
            <div className="flex flex-col gap-xs">
              {SORTS.map((s) => (
                <RadioRow
                  key={s.key}
                  label={s.label}
                  value={s.key}
                  current={readString("sort")}
                  onChange={(v) => update({ sort: v || null })}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="เพิ่มเติม" className="md:col-span-2">
            <div className="flex flex-col sm:flex-row gap-md">
              <CheckRow
                label="เฉพาะกลุ่มที่มีครบ 3 ร้าน"
                checked={readBool("full")}
                onChange={() => update({ full: readBool("full") ? null : "1" })}
              />
              <CheckRow
                label="เฉพาะ matchKey ตรงเป๊ะ (ไม่รวมใกล้เคียง)"
                checked={readBool("exact")}
                onChange={() => update({ exact: readBool("exact") ? null : "1" })}
              />
            </div>
          </FilterGroup>
        </div>
      )}
    </div>
  );
}

function FilterGroup({
  label,
  children,
  className = ""
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex flex-col gap-xs ${className}`}>
      <p className="font-label-caps text-label-caps text-outline uppercase tracking-widest">
        {label}
      </p>
      {children}
    </section>
  );
}

function CheckChip({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      role="checkbox"
      aria-checked={checked}
      className={`inline-flex items-center gap-xs px-sm py-xs border rounded text-body-sm transition-colors ${
        checked
          ? "bg-primary text-on-primary border-primary"
          : "bg-surface text-on-surface border-outline-variant hover:bg-surface-container"
      }`}
    >
      <span
        className={`flex items-center justify-center h-3.5 w-3.5 rounded-sm border ${
          checked ? "bg-on-primary border-on-primary" : "border-outline"
        }`}
      >
        {checked && (
          <svg
            className="h-3 w-3 text-primary"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0l-3.6-3.6a1 1 0 111.4-1.4L8.6 12 15.3 5.3a1 1 0 011.4 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

function CheckRow({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="inline-flex items-center gap-xs cursor-pointer text-body-sm text-on-surface select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-primary"
      />
      {label}
    </label>
  );
}

function RadioRow({
  label,
  value,
  current,
  onChange
}: {
  label: string;
  value: string;
  current: string;
  onChange: (value: string) => void;
}) {
  const checked = current === value;
  return (
    <label className="inline-flex items-center gap-xs cursor-pointer text-body-sm text-on-surface select-none">
      <input
        type="radio"
        checked={checked}
        onChange={() => onChange(value)}
        className="h-4 w-4 accent-primary"
        name="sort"
      />
      {label}
    </label>
  );
}
