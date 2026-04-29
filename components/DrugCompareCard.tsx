import Link from "next/link";
import { ArrowRight, Check, MinusCircle, Sparkles, Star } from "lucide-react";
import { buildCompareHref, type DrugGroup, type Vendor } from "@/lib/api";
import {
  formatMoney,
  STOCK_STATUS_LABEL,
  STOCK_STATUS_TONE,
  VENDOR_LABEL
} from "@/lib/format";
import { AddToCartButton } from "./AddToCartButton";

const VENDOR_LIST: Vendor[] = ["msk", "somsak", "sor"];

export function DrugCompareCard({ group }: { group: DrugGroup }) {
  const priced = VENDOR_LIST.map((vendor) => ({ vendor, match: group.vendors[vendor] }))
    .filter((entry) => entry.match && typeof entry.match.product.price === "number")
    .sort(
      (a, b) => (a.match!.product.price ?? Infinity) - (b.match!.product.price ?? Infinity)
    );

  const cheapestVendor = priced[0]?.vendor;
  const mostExpensive = priced[priced.length - 1];
  const savings =
    priced.length >= 2 && mostExpensive?.match?.product.price && priced[0]?.match?.product.price
      ? mostExpensive.match.product.price - priced[0].match.product.price
      : 0;

  return (
    <article className="border border-outline-variant rounded bg-surface-container-lowest p-sm sm:p-md flex flex-col gap-sm hover:border-primary/50 transition-colors">
      <header className="flex items-start justify-between gap-xs sm:gap-sm">
        <div className="flex flex-col gap-xs min-w-0">
          <h3 className="font-h2 text-[18px] sm:text-h2 text-on-surface leading-tight line-clamp-2 sm:truncate" title={group.anchor.rawName}>
            {group.anchor.rawName}
          </h3>
          {group.anchor.genericName && (
            <span className="text-[12px] sm:text-body-sm text-on-surface-variant truncate">
              Generic: {group.anchor.genericName}
            </span>
          )}
          <div className="flex flex-wrap gap-xs text-[11px] sm:text-[12px] text-on-surface-variant font-mono">
            {group.anchor.strength && <span>{group.anchor.strength}</span>}
            {group.anchor.packSize && <span>· {group.anchor.packSize}</span>}
            {group.anchor.unit && <span>· {group.anchor.unit}</span>}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-xs">
          <AddToCartButton
            matchKey={group.matchKey}
            rawName={group.anchor.rawName}
            size="sm"
            variant="icon"
          />
          <Link
            href={buildCompareHref(group.matchKey)}
            className="inline-flex items-center gap-xs text-[10px] sm:text-[11px] font-label-caps text-primary hover:underline whitespace-nowrap uppercase tracking-widest min-h-[32px]"
            aria-label={`ดูรายละเอียดเปรียบเทียบ ${group.anchor.rawName}`}
          >
            <span className="hidden sm:inline">ดูรายละเอียด</span>
            <span className="sm:hidden">ดูเพิ่ม</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-xs">
        {VENDOR_LIST.map((vendor) => (
          <VendorPriceCell
            key={vendor}
            vendor={vendor}
            match={group.vendors[vendor]}
            isCheapest={vendor === cheapestVendor}
          />
        ))}
      </div>

      {savings > 0 && (
        <div className="flex justify-between items-center text-[12px] text-on-surface-variant border-t border-outline-variant pt-sm">
          <span className="inline-flex items-center gap-xs">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            ประหยัดได้สูงสุด <strong className="text-primary">฿{formatMoney(savings)}</strong>
          </span>
          <span>
            {priced.length}/{VENDOR_LIST.length} ร้านมีของ
          </span>
        </div>
      )}
    </article>
  );
}

function VendorPriceCell({
  vendor,
  match,
  isCheapest
}: {
  vendor: Vendor;
  match?: { matchType: "exact" | "similar"; product: any; score?: number };
  isCheapest: boolean;
}) {
  if (!match) {
    return (
      <div className="border border-outline-variant rounded p-xs sm:p-sm flex flex-col gap-xs opacity-50 min-h-[110px] sm:min-h-[120px]">
        <span className="font-label-caps text-[10px] sm:text-label-caps text-outline uppercase tracking-widest">
          {VENDOR_LABEL[vendor]}
        </span>
        <span className="text-[12px] sm:text-body-sm text-on-surface-variant flex-1 flex items-center gap-xs">
          <MinusCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">ไม่พบ</span>
        </span>
      </div>
    );
  }

  const product = match.product;
  const stock = product.stockStatus ?? "unknown";

  return (
    <Link
      href={`/product/${product.vendorKey}/${encodeURIComponent(product.identityKey)}`}
      className={`border rounded p-sm flex flex-col gap-xs transition-colors min-h-[120px] ${
        isCheapest
          ? "border-primary bg-primary/5 hover:bg-primary/10"
          : "border-outline-variant hover:bg-surface-container"
      }`}
    >
      <div className="flex items-center justify-between gap-xs">
        <span className="font-label-caps text-label-caps text-outline uppercase tracking-widest">
          {VENDOR_LABEL[vendor]}
        </span>
        <MatchBadge matchType={match.matchType} score={match.score} />
      </div>
      <div className="flex items-baseline gap-xs">
        <span
          className={`font-h2 text-h2 leading-none ${
            isCheapest ? "text-primary" : "text-on-surface"
          }`}
        >
          {formatMoney(product.price ?? null)}
        </span>
        <span className="text-[11px] text-on-surface-variant">
          / {product.unit ?? "—"}
        </span>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded font-label-caps text-[9px] uppercase ${
            STOCK_STATUS_TONE[stock] ?? STOCK_STATUS_TONE.unknown
          }`}
        >
          {STOCK_STATUS_LABEL[stock] ?? stock}
        </span>
        {isCheapest && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-label-caps uppercase text-primary font-bold">
            <Star className="h-3 w-3 fill-current" />
            ถูกสุด
          </span>
        )}
      </div>
    </Link>
  );
}

function MatchBadge({ matchType, score }: { matchType: "exact" | "similar"; score?: number }) {
  if (matchType === "exact") {
    return (
      <span
        className="inline-flex items-center gap-0.5 text-[10px] font-label-caps uppercase text-secondary"
        title="matchKey ตรงกัน"
      >
        <Check className="h-3 w-3" />
        ตรง
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] font-label-caps uppercase text-on-surface-variant italic"
      title={`ใกล้เคียง · score ${score?.toFixed(1) ?? "?"}`}
    >
      <span className="font-mono not-italic">≈</span>
      ใกล้เคียง
    </span>
  );
}
