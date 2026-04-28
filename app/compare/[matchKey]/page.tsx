import Link from "next/link";
import { ArrowLeft, Check, Info, MinusCircle, Star, TrendingDown } from "lucide-react";
import { getCompare, safeDecodeMatchKey, type Vendor } from "@/lib/api";
import {
  formatDate,
  formatMoney,
  STOCK_STATUS_LABEL,
  STOCK_STATUS_TONE,
  VENDOR_LABEL
} from "@/lib/format";

export const revalidate = 10;

const VENDOR_LIST: { key: Vendor; name: string }[] = [
  { key: "msk", name: "MSK / หมอยาสิริกร" },
  { key: "somsak", name: "Somsak Pharma" },
  { key: "sor", name: "SOR Pharmacy / ส.เภสัชกร" }
];

interface PageProps {
  params: Promise<{ matchKey: string }>;
}

export default async function ComparePage({ params }: PageProps) {
  const { matchKey: rawParam } = await params;
  const matchKey = safeDecodeMatchKey(rawParam);

  let compare;
  let error: string | null = null;
  try {
    compare = await getCompare(matchKey);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
  }

  if (error || !compare) {
    return (
      <main className="flex-grow w-full max-w-container-max mx-auto px-gutter pt-md pb-xl">
        <div className="border border-error rounded bg-error-container/40 p-md text-on-error-container">
          ไม่สามารถโหลดข้อมูลเปรียบเทียบ: {error ?? "ไม่ทราบสาเหตุ"}
        </div>
      </main>
    );
  }

  const cheapestKey = compare.cheapest?.vendorKey;

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-gutter pt-md pb-xl flex flex-col gap-md">
      <Link
        href="/search"
        className="inline-flex items-center gap-xs text-on-surface-variant text-body-sm hover:text-primary transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับสู่ผลค้นหา
      </Link>

      <section className="flex flex-col gap-xs">
        <p className="font-label-caps text-label-caps text-outline uppercase tracking-widest">
          Cross-vendor comparison · 3 brands
        </p>
        <h1 className="font-h1 text-h1">
          {compare.source?.rawName || matchKey.split("|")[0] || "เปรียบเทียบยา"}
        </h1>
        {compare.source?.genericName && (
          <p className="text-body-md text-on-surface-variant">
            Generic: {compare.source.genericName}
          </p>
        )}
        <p className="font-mono text-[12px] text-on-surface-variant break-all">
          match key: {matchKey}
        </p>
        {compare.synthesized && (
          <p className="inline-flex items-start gap-xs text-body-sm text-on-surface-variant border-l-2 border-tertiary-fixed pl-sm py-xs">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            ไม่พบสินค้าที่มี matchKey นี้ตรงๆ ในระบบ — แสดงผลใกล้เคียงจากการค้นหา ES
          </p>
        )}
        <p className="text-body-sm text-on-surface-variant">
          ครอบคลุม <strong>{compare.vendorsCovered}/{VENDOR_LIST.length}</strong> ร้าน
          {compare.cheapest ? (
            <>
              {" "}·{" "}
              <span className="inline-flex items-center gap-xs">
                <TrendingDown className="h-3.5 w-3.5 text-primary" />
                ถูกที่สุดที่{" "}
                <strong className="text-primary">
                  {VENDOR_LABEL[compare.cheapest.vendorKey] ?? compare.cheapest.vendorKey}
                </strong>{" "}
                ฿{formatMoney(compare.cheapest.price)}
              </span>
            </>
          ) : null}
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {VENDOR_LIST.map(({ key, name }) => {
          const slot = compare.vendors[key];
          const product = slot?.products[0];
          const isCheapest = cheapestKey === key;
          const stock = product?.stockStatus ?? "unknown";

          if (!slot || slot.matchType === "none" || !product) {
            return (
              <article
                key={key}
                className="border border-outline-variant rounded bg-surface-container/50 p-md flex flex-col gap-sm min-h-[280px] opacity-60"
              >
                <header className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-widest">
                    {VENDOR_LABEL[key]}
                  </span>
                  <span className="inline-flex items-center gap-xs text-[10px] font-label-caps text-on-surface-variant uppercase">
                    <MinusCircle className="h-3 w-3" />
                    ไม่มีของ
                  </span>
                </header>
                <p className="text-body-sm text-on-surface-variant">
                  ไม่พบสินค้านี้ในร้าน {name}
                </p>
              </article>
            );
          }

          return (
            <article
              key={key}
              className={`border rounded p-md flex flex-col gap-sm min-h-[280px] ${
                isCheapest
                  ? "border-primary bg-primary/5"
                  : "border-outline-variant bg-surface-container-lowest"
              }`}
            >
              <header className="flex items-center justify-between gap-xs">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-widest">
                  {VENDOR_LABEL[key]}
                </span>
                {slot.matchType === "exact" ? (
                  <span className="inline-flex items-center gap-xs px-2 py-0.5 rounded font-label-caps text-[10px] uppercase bg-secondary-container text-on-secondary-container">
                    <Check className="h-3 w-3" />
                    ตรงเป๊ะ
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-xs px-2 py-0.5 rounded font-label-caps text-[10px] uppercase bg-tertiary-fixed text-on-tertiary-fixed"
                    title={`score ${slot.score?.toFixed(1) ?? "?"}`}
                  >
                    <span className="font-mono">≈</span>
                    ใกล้เคียง
                  </span>
                )}
              </header>

              <h3 className="font-h2 text-h2 text-on-surface leading-tight">{product.rawName}</h3>
              {product.genericName && (
                <p className="text-body-sm text-on-surface-variant">{product.genericName}</p>
              )}

              <div className="flex items-baseline gap-xs">
                <span
                  className={`font-display text-[36px] leading-none font-semibold ${
                    isCheapest ? "text-primary" : "text-on-surface"
                  }`}
                >
                  {formatMoney(product.price ?? null)}
                </span>
                <span className="text-body-sm text-on-surface-variant">
                  ฿ / {product.unit ?? "—"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded font-label-caps text-[10px] uppercase ${
                    STOCK_STATUS_TONE[stock] ?? STOCK_STATUS_TONE.unknown
                  }`}
                >
                  {STOCK_STATUS_LABEL[stock] ?? stock}
                </span>
                {isCheapest && (
                  <span className="inline-flex items-center gap-xs text-[11px] font-label-caps uppercase text-primary font-bold">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    ถูกที่สุด
                  </span>
                )}
              </div>

              <div className="text-[12px] text-on-surface-variant mt-auto">
                เห็นล่าสุด: {formatDate(product.lastSeenAt)}
              </div>

              <Link
                href={`/product/${product.vendorKey}/${encodeURIComponent(product.identityKey)}`}
                className="inline-flex items-center gap-xs text-primary text-body-sm hover:underline"
              >
                ดูรายละเอียด + ประวัติราคา
                <span aria-hidden="true">→</span>
              </Link>

              {slot.products.length > 1 && (
                <p className="text-[11px] text-on-surface-variant border-t border-outline-variant pt-xs">
                  + อีก {slot.products.length - 1} ตัวเลือกในร้านนี้
                </p>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
