import Link from "next/link";
import { Check, MapPin, MinusCircle, Star, TrendingDown } from "lucide-react";
import { getCompare, type Vendor } from "@/lib/api";
import {
  formatDate,
  formatMoney,
  STOCK_STATUS_LABEL,
  STOCK_STATUS_TONE,
  VENDOR_LABEL
} from "@/lib/format";
import { AddToCartButton } from "./AddToCartButton";

const VENDOR_LIST: { key: Vendor; name: string }[] = [
  { key: "msk", name: "MSK" },
  { key: "somsak", name: "Somsak" },
  { key: "sor", name: "SOR" }
];

interface Props {
  matchKey: string;
  /** vendorKey of the product the user is currently viewing (for "you-are-here" highlight). */
  currentVendor?: string;
  /** identityKey of the current product (used to confirm exact match before highlight). */
  currentIdentityKey?: string;
}

export async function CrossVendorCompareSection({
  matchKey,
  currentVendor,
  currentIdentityKey
}: Props) {
  let compare;
  let error: string | null = null;
  try {
    compare = await getCompare(matchKey);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
  }

  if (error || !compare) {
    return (
      <div className="border border-outline-variant rounded bg-surface-container/50 p-md text-on-surface-variant text-body-sm">
        ไม่สามารถโหลดข้อมูลเปรียบเทียบ: {error ?? "ไม่ทราบสาเหตุ"}
      </div>
    );
  }

  const cheapestKey = compare.cheapest?.vendorKey;

  return (
    <div className="flex flex-col gap-sm">
      <div className="text-body-sm text-on-surface-variant flex items-center flex-wrap gap-xs">
        ครอบคลุม{" "}
        <strong className="text-on-surface">
          {compare.vendorsCovered}/{VENDOR_LIST.length}
        </strong>{" "}
        ร้าน
        {compare.cheapest ? (
          <span className="inline-flex items-center gap-xs">
            <span className="opacity-50">·</span>
            <TrendingDown className="h-3.5 w-3.5 text-primary" />
            ถูกที่สุดที่{" "}
            <strong className="text-primary">
              {VENDOR_LABEL[compare.cheapest.vendorKey] ?? compare.cheapest.vendorKey}
            </strong>{" "}
            ฿{formatMoney(compare.cheapest.price)}
          </span>
        ) : null}
        {compare.synthesized && (
          <span className="inline-flex items-center gap-xs px-xs py-px rounded text-[10px] font-label-caps uppercase bg-tertiary-fixed text-on-tertiary-fixed">
            ค้นแบบใกล้เคียง
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-sm">
        {VENDOR_LIST.map(({ key }) => {
          const slot = compare!.vendors[key];
          const product = slot?.products[0];
          const isCheapest = cheapestKey === key;
          const isCurrent =
            currentVendor === key && product?.identityKey === currentIdentityKey;
          const stock = product?.stockStatus ?? "unknown";

          if (!slot || slot.matchType === "none" || !product) {
            return (
              <article
                key={key}
                className="border border-outline-variant rounded bg-surface-container/40 p-sm flex flex-col gap-xs min-h-[150px] opacity-60"
              >
                <header className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-outline uppercase tracking-widest">
                    {VENDOR_LABEL[key]}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-label-caps text-on-surface-variant uppercase">
                    <MinusCircle className="h-3 w-3" />
                    ไม่มีของ
                  </span>
                </header>
                <p className="text-body-sm text-on-surface-variant mt-auto">
                  ไม่พบสินค้านี้ในร้าน
                </p>
              </article>
            );
          }

          return (
            <article
              key={key}
              className={`border rounded p-sm flex flex-col gap-xs min-h-[150px] ${
                isCurrent
                  ? "border-secondary bg-secondary-container/30 ring-1 ring-secondary"
                  : isCheapest
                    ? "border-primary bg-primary/5"
                    : "border-outline-variant bg-surface-container-lowest"
              }`}
            >
              <header className="flex items-center justify-between gap-xs">
                <span className="font-label-caps text-label-caps text-outline uppercase tracking-widest">
                  {VENDOR_LABEL[key]}
                </span>
                <div className="flex items-center gap-xs">
                  {isCurrent && (
                    <span
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-label-caps text-[10px] uppercase bg-secondary text-on-secondary"
                      title="คุณกำลังดูสินค้านี้อยู่"
                    >
                      <MapPin className="h-3 w-3" />
                      ปัจจุบัน
                    </span>
                  )}
                  {slot.matchType === "exact" ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-label-caps text-[10px] uppercase bg-secondary-container text-on-secondary-container">
                      <Check className="h-3 w-3" />
                      ตรง
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-label-caps text-[10px] uppercase bg-tertiary-fixed text-on-tertiary-fixed"
                      title={`ใกล้เคียง · score ${slot.score?.toFixed(1) ?? "?"}`}
                    >
                      <span className="font-mono">≈</span>
                      ใกล้เคียง
                    </span>
                  )}
                </div>
              </header>

              <p className="text-body-sm text-on-surface line-clamp-2 leading-tight">
                {product.rawName}
              </p>

              <div className="flex items-baseline gap-xs">
                <span
                  className={`font-h2 text-h2 leading-none ${
                    isCheapest ? "text-primary" : "text-on-surface"
                  }`}
                >
                  {formatMoney(product.price ?? null)}
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  ฿ / {product.unit ?? "—"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-xs mt-auto">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded font-label-caps text-[10px] uppercase ${
                    STOCK_STATUS_TONE[stock] ?? STOCK_STATUS_TONE.unknown
                  }`}
                >
                  {STOCK_STATUS_LABEL[stock] ?? stock}
                </span>
                {isCheapest && !isCurrent && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-label-caps uppercase text-primary font-bold">
                    <Star className="h-3 w-3 fill-current" />
                    ถูกสุด
                  </span>
                )}
              </div>

              <div className="text-[11px] text-on-surface-variant flex items-center justify-between gap-xs">
                <span className="truncate">เห็นล่าสุด: {formatDate(product.lastSeenAt)}</span>
                <div className="flex items-center gap-xs shrink-0">
                  <AddToCartButton
                    matchKey={compare.matchKey}
                    rawName={product.rawName}
                    size="sm"
                    variant="icon"
                  />
                  {!isCurrent && (
                    <Link
                      href={`/product/${product.vendorKey}/${encodeURIComponent(
                        product.identityKey
                      )}`}
                      className="text-primary hover:underline whitespace-nowrap"
                    >
                      ดู →
                    </Link>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function CrossVendorCompareSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-sm">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="border border-outline-variant rounded bg-surface-container-lowest p-sm flex flex-col gap-xs min-h-[150px] animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-12 bg-surface-container rounded" />
            <div className="h-4 w-12 bg-surface-container rounded" />
          </div>
          <div className="h-4 w-3/4 bg-surface-container rounded" />
          <div className="h-7 w-20 bg-surface-container rounded" />
          <div className="mt-auto h-3 w-1/2 bg-surface-container rounded" />
        </div>
      ))}
    </div>
  );
}
