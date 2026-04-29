"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Copy,
  Download,
  Inbox,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import { useCart, type CartItem, type Vendor } from "@/lib/cart";
import { lookupCart, type EnrichedCartItem } from "@/lib/cart-api";
import { optimizeCart, type OptimizeSummary } from "@/lib/cart-optimizer";
import { summaryToCsv, summaryToTextBlocks } from "@/lib/cart-export";
import { formatMoney, VENDOR_LABEL } from "@/lib/format";

const VENDORS: Vendor[] = ["msk", "somsak", "sor"];

export function CartView() {
  const cart = useCart();
  const [enriched, setEnriched] = useState<EnrichedCartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lookup whenever cart changes
  useEffect(() => {
    let cancelled = false;
    if (cart.items.length === 0) {
      setEnriched([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    lookupCart(cart.items.map((i) => ({ matchKey: i.matchKey, qty: i.qty })))
      .then((result) => {
        if (!cancelled) setEnriched(result.items);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cart.items]);

  const summary = useMemo<OptimizeSummary | null>(() => {
    if (enriched.length === 0 || cart.items.length === 0) return null;
    return optimizeCart(
      cart.items.map((i) => ({
        matchKey: i.matchKey,
        rawName: i.rawName,
        qty: i.qty,
        pinnedVendor: i.pinnedVendor
      })),
      enriched
    );
  }, [cart.items, enriched]);

  if (cart.items.length === 0) {
    return (
      <div className="border border-outline-variant rounded bg-surface-container/50 p-lg text-center text-on-surface-variant flex flex-col items-center gap-sm">
        <Inbox className="h-8 w-8" />
        <p>ตะกร้ายังว่าง — ลองเพิ่มยาจากหน้าค้นหาหรือหน้าสินค้า</p>
        <Link
          href="/search"
          className="inline-flex items-center gap-xs text-primary hover:underline"
        >
          ไปหน้าค้นหา <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="border border-error rounded bg-error-container/40 p-md text-on-error-container text-body-sm">
          ดึงราคาไม่สำเร็จ: {error}
        </div>
      )}

      {summary && <SummaryBanner summary={summary} />}

      <ItemsList cart={cart} summary={summary} loading={loading} />

      {summary && summary.rows.some((r) => r.pickedVendor !== null) && (
        <PerVendorBreakdown summary={summary} />
      )}
    </>
  );
}

function SummaryBanner({ summary }: { summary: OptimizeSummary }) {
  const single = summary.totals.cheapestSingleVendor;
  return (
    <section className="border border-outline-variant rounded bg-surface-container-lowest p-md flex flex-col gap-sm">
      <div className="flex items-baseline justify-between flex-wrap gap-sm">
        <div>
          <p className="font-label-caps text-label-caps text-outline uppercase tracking-widest">
            แนะนำ: ซื้อแบบกระจาย
          </p>
          <p className="text-[28px] sm:text-display font-display leading-none text-primary">
            ฿{formatMoney(summary.totals.bySplit)}
          </p>
        </div>
        {summary.totals.saving > 0 && (
          <div className="text-right">
            <p className="text-body-sm text-on-surface-variant">
              ประหยัดได้ <strong className="text-primary">฿{formatMoney(summary.totals.saving)}</strong>
            </p>
            <p className="text-[12px] text-on-surface-variant">
              เทียบกับซื้อจาก {VENDOR_LABEL[single!.vendor]} ทั้งหมด ฿{formatMoney(single!.total)}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-xs text-[12px]">
        {VENDORS.map((v) => {
          const total = summary.totals.byVendor[v];
          const carriesAll = summary.rows.every(
            (r) => r.vendors[v].available && r.vendors[v].product?.price !== null
          );
          return (
            <div
              key={v}
              className={`border rounded p-xs flex flex-col gap-px ${
                carriesAll
                  ? "border-outline-variant bg-surface"
                  : "border-outline-variant/40 bg-surface-container/40 opacity-70"
              }`}
            >
              <span className="font-label-caps text-[10px] text-outline uppercase tracking-widest">
                {VENDOR_LABEL[v]}
              </span>
              <span className="font-mono text-on-surface">฿{formatMoney(total)}</span>
              <span className="text-[10px] text-on-surface-variant">
                {carriesAll ? "มีครบทุกรายการ" : "ไม่ครบ"}
              </span>
            </div>
          );
        })}
      </div>

      {summary.unmatchedCount > 0 && (
        <p className="text-[12px] text-error">
          มี {summary.unmatchedCount} รายการที่ยังไม่มีร้านไหนของพร้อมส่ง
        </p>
      )}
    </section>
  );
}

function ItemsList({
  cart,
  summary,
  loading
}: {
  cart: ReturnType<typeof useCart>;
  summary: OptimizeSummary | null;
  loading: boolean;
}) {
  return (
    <section className="flex flex-col gap-xs">
      <header className="flex items-center justify-between">
        <p className="font-label-caps text-label-caps text-outline uppercase tracking-widest">
          รายการในตะกร้า ({cart.items.length})
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm("ล้างตะกร้าทั้งหมด?")) cart.clear();
          }}
          className="inline-flex items-center gap-xs text-[12px] text-on-surface-variant hover:text-error transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          ล้างทั้งหมด
        </button>
      </header>

      <ul className="flex flex-col gap-xs">
        {cart.items.map((item) => (
          <CartItemRow
            key={item.matchKey}
            item={item}
            summary={summary}
            loading={loading}
          />
        ))}
      </ul>
    </section>
  );
}

function CartItemRow({
  item,
  summary,
  loading
}: {
  item: CartItem;
  summary: OptimizeSummary | null;
  loading: boolean;
}) {
  const cart = useCart();
  const row = summary?.rows.find((r) => r.matchKey === item.matchKey) ?? null;

  return (
    <li className="border border-outline-variant rounded bg-surface-container-lowest p-sm flex flex-col gap-xs">
      <div className="flex items-start justify-between gap-sm">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-body-md text-on-surface line-clamp-2">{item.rawName}</span>
          <span className="text-[11px] text-on-surface-variant font-mono break-all">
            {item.matchKey}
          </span>
        </div>
        <div className="flex items-center gap-xs shrink-0">
          <input
            type="number"
            min={1}
            max={9999}
            value={item.qty}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (Number.isFinite(next)) cart.setQty(item.matchKey, next);
            }}
            className="w-16 px-xs py-px border border-outline-variant rounded text-body-sm text-right bg-surface focus:outline-none focus:border-primary"
            aria-label="จำนวน"
          />
          <button
            type="button"
            onClick={() => cart.remove(item.matchKey)}
            aria-label="เอาออกจากตะกร้า"
            title="เอาออกจากตะกร้า"
            className="text-outline hover:text-error transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading && !row && (
        <span className="text-[11px] text-on-surface-variant">กำลังดึงราคา...</span>
      )}

      {row && (
        <div className="grid grid-cols-3 gap-xs">
          {(["msk", "somsak", "sor"] as Vendor[]).map((v) => {
            const slot = row.vendors[v];
            const isPicked = row.pickedVendor === v;
            const product = slot.product;
            return (
              <button
                key={v}
                type="button"
                onClick={() => {
                  if (item.pinnedVendor === v) cart.setPinnedVendor(item.matchKey, undefined);
                  else if (slot.available) cart.setPinnedVendor(item.matchKey, v);
                }}
                disabled={!slot.available}
                className={`border rounded p-xs flex flex-col gap-px text-left transition-colors ${
                  isPicked
                    ? "border-primary bg-primary/5"
                    : slot.available
                      ? "border-outline-variant hover:border-primary/40"
                      : "border-outline-variant/40 bg-surface-container/40 opacity-50 cursor-not-allowed"
                }`}
              >
                <span className="font-label-caps text-[9px] text-outline uppercase tracking-widest">
                  {VENDOR_LABEL[v]}
                </span>
                {product ? (
                  <>
                    <span className={`font-mono text-body-sm ${isPicked ? "text-primary" : "text-on-surface"}`}>
                      ฿{formatMoney(product.price)}
                    </span>
                    <span className="text-[10px] text-on-surface-variant truncate">
                      {product.unit ?? "—"}
                      {!slot.available && " · หมด"}
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] text-on-surface-variant">ไม่พบ</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {row?.pickedVendor && (
        <p className="text-[11px] text-on-surface-variant">
          แนะนำซื้อจาก{" "}
          <strong className="text-primary">{VENDOR_LABEL[row.pickedVendor]}</strong>
          {" "}ราคา ฿{formatMoney(row.pickedPrice)} × {row.qty} = ฿{formatMoney(row.pickedTotal)}
          {item.pinnedVendor && " (ปักหมุดไว้)"}
        </p>
      )}
    </li>
  );
}

function PerVendorBreakdown({ summary }: { summary: OptimizeSummary }) {
  return (
    <section className="flex flex-col gap-md">
      <header>
        <p className="inline-flex items-center gap-xs font-label-caps text-label-caps text-outline uppercase tracking-widest">
          <Sparkles className="h-3.5 w-3.5" />
          ใบสั่งซื้อแยกร้าน
        </p>
        <h2 className="font-h2 text-h2">คัดลอก/ดาวน์โหลดเพื่อส่งให้ร้าน</h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {VENDORS.map((vendor) => {
          const rows = summary.perVendorBreakdown[vendor];
          if (rows.length === 0) {
            return (
              <article
                key={vendor}
                className="border border-outline-variant/40 rounded bg-surface-container/30 p-sm flex flex-col gap-xs opacity-60 min-h-[150px]"
              >
                <p className="font-label-caps text-label-caps text-outline uppercase tracking-widest">
                  {VENDOR_LABEL[vendor]}
                </p>
                <p className="text-[12px] text-on-surface-variant">ไม่มีรายการที่แนะนำให้ซื้อจากร้านนี้</p>
              </article>
            );
          }
          const total = rows.reduce((s, r) => s + r.pickedTotal, 0);
          return (
            <article
              key={vendor}
              className="border border-outline-variant rounded bg-surface-container-lowest p-sm flex flex-col gap-xs"
            >
              <header className="flex items-center justify-between">
                <p className="font-label-caps text-label-caps text-outline uppercase tracking-widest">
                  {VENDOR_LABEL[vendor]}
                </p>
                <span className="font-mono text-body-sm text-on-surface">
                  ฿{formatMoney(total)}
                </span>
              </header>
              <ul className="flex flex-col gap-px text-[12px]">
                {rows.map((r) => (
                  <li key={r.matchKey} className="flex justify-between gap-xs">
                    <span className="truncate">{r.rawName}</span>
                    <span className="font-mono text-on-surface-variant whitespace-nowrap">
                      ×{r.qty} ฿{formatMoney(r.pickedTotal)}
                    </span>
                  </li>
                ))}
              </ul>
              <CopyBlockButton vendor={vendor} summary={summary} />
            </article>
          );
        })}
      </div>

      <ExportButtons summary={summary} />
    </section>
  );
}

function CopyBlockButton({ vendor, summary }: { vendor: Vendor; summary: OptimizeSummary }) {
  const [copied, setCopied] = useState(false);
  const blocks = summaryToTextBlocks(summary);
  const block = blocks.find((b) => b.vendor === vendor);
  if (!block) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(block.text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* ignore */
        }
      }}
      className="inline-flex items-center gap-xs px-xs py-px border border-outline-variant rounded text-[11px] text-on-surface hover:bg-surface-container transition-colors w-fit"
    >
      <Copy className="h-3 w-3" />
      {copied ? "คัดลอกแล้ว!" : "คัดลอกข้อความ"}
    </button>
  );
}

function ExportButtons({ summary }: { summary: OptimizeSummary }) {
  function downloadCsv() {
    const csv = summaryToCsv(summary);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `compair-cart-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap gap-xs">
      <button
        type="button"
        onClick={downloadCsv}
        className="inline-flex items-center gap-xs px-sm py-xs border border-outline-variant rounded text-body-sm text-on-surface hover:bg-surface-container transition-colors"
      >
        <Download className="h-4 w-4" />
        ดาวน์โหลด CSV
      </button>
    </div>
  );
}
