"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { SearchAggregations } from "@/lib/api";
import { STOCK_STATUS_LABEL, VENDOR_LABEL } from "@/lib/format";

interface Props {
  aggregations: SearchAggregations;
}

export function FacetSidebar({ aggregations }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function toggle(name: string, value: string) {
    const next = new URLSearchParams(params?.toString() ?? "");
    const current = (next.get(name) ?? "").split(",").filter(Boolean);
    const exists = current.includes(value);
    const updated = exists ? current.filter((item) => item !== value) : [...current, value];
    if (updated.length === 0) next.delete(name);
    else next.set(name, updated.join(","));
    next.delete("page");
    router.push(`/search?${next.toString()}`);
  }

  function isActive(name: string, value: string): boolean {
    const current = (params?.get(name) ?? "").split(",").filter(Boolean);
    return current.includes(value);
  }

  return (
    <aside className="flex flex-col gap-md">
      <FacetGroup title="ร้าน">
        {(aggregations.vendors?.buckets ?? []).map((bucket) => (
          <FacetCheck
            key={bucket.key}
            label={`${VENDOR_LABEL[bucket.key] ?? bucket.key}`}
            count={bucket.doc_count}
            active={isActive("vendor", bucket.key)}
            onChange={() => toggle("vendor", bucket.key)}
          />
        ))}
      </FacetGroup>

      <FacetGroup title="สถานะสต๊อก">
        {(aggregations.stockStatuses?.buckets ?? []).map((bucket) => (
          <FacetCheck
            key={bucket.key}
            label={STOCK_STATUS_LABEL[bucket.key] ?? bucket.key}
            count={bucket.doc_count}
            active={isActive("stockStatus", bucket.key)}
            onChange={() => toggle("stockStatus", bucket.key)}
          />
        ))}
      </FacetGroup>

      <FacetGroup title="หน่วย">
        {(aggregations.units?.buckets ?? []).slice(0, 12).map((bucket) => (
          <FacetCheck
            key={bucket.key}
            label={bucket.key}
            count={bucket.doc_count}
            active={isActive("unit", bucket.key)}
            onChange={() => toggle("unit", bucket.key)}
          />
        ))}
      </FacetGroup>

      <FacetGroup title="ช่วงราคา (บาท)">
        {(aggregations.priceRanges?.buckets ?? []).map((bucket) => {
          const min = bucket.from;
          const max = bucket.to;
          const label =
            min === undefined ? `< ${max}` : max === undefined ? `≥ ${min}` : `${min}–${max}`;
          const next = new URLSearchParams(params?.toString() ?? "");
          const isCurrent =
            (min === undefined ? !next.get("priceMin") : next.get("priceMin") === String(min)) &&
            (max === undefined ? !next.get("priceMax") : next.get("priceMax") === String(max));
          return (
            <button
              key={bucket.key}
              onClick={() => {
                const updated = new URLSearchParams(params?.toString() ?? "");
                if (isCurrent) {
                  updated.delete("priceMin");
                  updated.delete("priceMax");
                } else {
                  if (min !== undefined) updated.set("priceMin", String(min));
                  else updated.delete("priceMin");
                  if (max !== undefined) updated.set("priceMax", String(max));
                  else updated.delete("priceMax");
                }
                updated.delete("page");
                router.push(`/search?${updated.toString()}`);
              }}
              className={`flex justify-between items-center px-sm py-xs rounded border text-body-sm transition-colors ${
                isCurrent
                  ? "border-primary bg-primary text-on-primary"
                  : "border-outline-variant text-on-surface hover:bg-surface-container"
              }`}
            >
              <span>{label}</span>
              <span className="text-[12px] opacity-70">{bucket.doc_count}</span>
            </button>
          );
        })}
      </FacetGroup>
    </aside>
  );
}

function FacetGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="font-label-caps text-label-caps text-outline uppercase tracking-widest mb-sm">
        {title}
      </p>
      <div className="flex flex-col gap-xs">{children}</div>
    </section>
  );
}

function FacetCheck({
  label,
  count,
  active,
  onChange
}: {
  label: string;
  count: number;
  active: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center justify-between gap-sm px-sm py-xs rounded border border-outline-variant hover:bg-surface-container cursor-pointer">
      <span className="flex items-center gap-sm text-body-sm text-on-surface">
        <input
          type="checkbox"
          className="accent-primary"
          checked={active}
          onChange={onChange}
        />
        {label}
      </span>
      <span className="text-[12px] text-on-surface-variant">{count}</span>
    </label>
  );
}
