import { Suspense } from "react";
import type { Metadata } from "next";
import { Inbox, Pill, Sparkles, Store } from "lucide-react";
import { searchCompare, type DrugGroup, type Vendor } from "@/lib/api";
import { SearchBar } from "@/components/SearchBar";
import { DrugCompareCard } from "@/components/DrugCompareCard";
import { Skeleton } from "@/components/Skeleton";
import { AdvancedFilters } from "@/components/AdvancedFilters";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 10;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const q = pickString(params.q);
  const path = q ? `/search?q=${encodeURIComponent(q)}` : "/search";
  return buildMetadata({
    title: q ? `ค้นหา "${q}" — เทียบราคา 3 ร้าน` : "ค้นหายา + เทียบราคา 3 ร้าน",
    description: q
      ? `ผลการค้นหายา "${q}" จาก MSK · Somsak · SOR — เทียบราคาตรงในหน้าเดียว`
      : "ค้นหายาด้วยชื่อสามัญ ชื่อการค้า หรือบาร์โค้ด — ระบบดึงราคาจาก 3 ร้านมาเทียบให้อัตโนมัติ",
    path
  });
}

interface Filters {
  vendors: Vendor[];
  stocks: string[];
  priceMin: number | null;
  priceMax: number | null;
  sort: string;
  onlyExact: boolean;
  onlyFull: boolean;
}

function pickString(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? (value[0] ?? "") : value;
}

function pickList(value: string | string[] | undefined): string[] {
  return pickString(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function pickNumber(value: string | string[] | undefined): number | null {
  const raw = pickString(value);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function cheapestPrice(group: DrugGroup): number {
  const prices = Object.values(group.vendors)
    .map((v) => v?.product.price)
    .filter((p): p is number => typeof p === "number");
  return prices.length ? Math.min(...prices) : Infinity;
}

function maxSavings(group: DrugGroup): number {
  const prices = Object.values(group.vendors)
    .map((v) => v?.product.price)
    .filter((p): p is number => typeof p === "number");
  if (prices.length < 2) return 0;
  return Math.max(...prices) - Math.min(...prices);
}

/** Client-only filters (sort, exact-only, full-coverage). Vendor/stock/price are sent to ES. */
function applyClientFilters(groups: DrugGroup[], filters: Filters): DrugGroup[] {
  let out = [...groups];

  if (filters.onlyFull) {
    out = out.filter((g) => Object.keys(g.vendors).length === 3);
  }
  if (filters.onlyExact) {
    out = out.filter((g) =>
      Object.values(g.vendors).some((v) => v?.matchType === "exact")
    );
  }

  switch (filters.sort) {
    case "price_asc":
      out.sort((a, b) => cheapestPrice(a) - cheapestPrice(b));
      break;
    case "price_desc":
      out.sort((a, b) => cheapestPrice(b) - cheapestPrice(a));
      break;
    case "savings":
      out.sort((a, b) => maxSavings(b) - maxSavings(a));
      break;
  }

  return out;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = pickString(params.q);
  const sizeRaw = Number(pickString(params.size));
  const fetchSize = Number.isFinite(sizeRaw) && sizeRaw > 0 ? Math.min(40, sizeRaw) : 24;

  const filters: Filters = {
    vendors: pickList(params.vendor) as Vendor[],
    stocks: pickList(params.stock),
    priceMin: pickNumber(params.priceMin),
    priceMax: pickNumber(params.priceMax),
    sort: pickString(params.sort),
    onlyExact: pickString(params.exact) === "1",
    onlyFull: pickString(params.full) === "1"
  };

  // Suspense key includes anything that affects the ES fetch (so skeleton shows while re-fetching).
  const fetchKey = [
    q,
    fetchSize,
    filters.vendors.join(","),
    filters.stocks.join(","),
    filters.priceMin ?? "",
    filters.priceMax ?? ""
  ].join("|");

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-sm sm:px-gutter pt-md pb-xl flex flex-col gap-md overflow-hidden">
      <section className="flex flex-col gap-sm border border-outline-variant rounded-lg p-sm sm:p-md bg-surface-container-lowest">
        <p className="inline-flex items-center gap-xs font-label-caps text-label-caps text-outline uppercase tracking-widest">
          <Pill className="h-3.5 w-3.5" />
          Drug Index · Cross-vendor compare
        </p>
        <h1 className="font-h1 text-[24px] sm:text-h1 leading-tight">ค้นหายา + เทียบราคา 3 ร้าน</h1>
        <SearchBar initialValue={q} size="md" />
        <AdvancedFilters />
        <p className="text-body-sm text-on-surface-variant">
          ตัวกรองด้านบนจะถูกส่งไป Elasticsearch เป็นส่วนหนึ่งของคำค้น —
          แต่ละครั้งที่คุณติ๊ก/พิมพ์ ระบบจะค้นใหม่ทันที
        </p>
      </section>

      <Suspense key={fetchKey} fallback={<ResultsSkeleton />}>
        <Results q={q} size={fetchSize} filters={filters} />
      </Suspense>
    </main>
  );
}

async function Results({
  q,
  size,
  filters
}: {
  q: string;
  size: number;
  filters: Filters;
}) {
  let result;
  let error: string | null = null;
  try {
    result = await searchCompare({
      q,
      size,
      vendor: filters.vendors,
      stockStatus: filters.stocks,
      priceMin: filters.priceMin ?? undefined,
      priceMax: filters.priceMax ?? undefined
    });
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
  }

  if (error) {
    return (
      <div className="border border-error rounded bg-error-container/40 p-md text-on-error-container">
        ไม่สามารถดึงผลลัพธ์ได้: {error}
      </div>
    );
  }

  const rawGroups = result?.groups ?? [];
  const groups = applyClientFilters(rawGroups, filters);
  const fullCoverage = groups.filter((g) => Object.keys(g.vendors).length === 3).length;

  if (groups.length === 0) {
    return (
      <div className="border border-outline-variant rounded bg-surface-container/50 p-lg text-center text-on-surface-variant">
        <span className="inline-flex items-center gap-xs">
          <Inbox className="h-5 w-5" />
          {rawGroups.length === 0
            ? q
              ? `ไม่พบยาที่ตรงกับ "${q}" + ตัวกรองที่เลือก`
              : "ลองพิมพ์ชื่อยาในช่องค้นหาด้านบน"
            : `กรองออกหมดทั้ง ${rawGroups.length} กลุ่ม — ลองล้างตัวกรอง`}
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between text-body-sm text-on-surface-variant flex-wrap gap-sm">
        <span className="inline-flex items-center gap-xs">
          <Sparkles className="h-4 w-4 text-primary" />
          แสดง <strong className="text-on-surface">{groups.length}</strong>
          {rawGroups.length !== groups.length && <> / {rawGroups.length}</>} กลุ่มยา
          {q ? <> สำหรับ "<span className="font-mono">{q}</span>"</> : null}
          {result ? <> · ครอบคลุม {result.total.toLocaleString("th-TH")} รายการที่ตรงตัวกรอง</> : null}
        </span>
        <span className="inline-flex items-center gap-xs">
          <Store className="h-4 w-4 text-secondary" />
          <strong className="text-secondary">{fullCoverage}</strong> กลุ่มมีครบ 3 ร้าน
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {groups.map((group) => (
          <DrugCompareCard key={group.matchKey} group={group} />
        ))}
      </div>
    </>
  );
}

function ResultsSkeleton() {
  return (
    <>
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
    </>
  );
}
