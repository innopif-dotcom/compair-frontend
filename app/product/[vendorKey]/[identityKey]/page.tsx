import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, LineChart, Scale } from "lucide-react";
import { getProduct, getPriceHistory, safeDecodeParam } from "@/lib/api";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import {
  CrossVendorCompareSection,
  CrossVendorCompareSkeleton
} from "@/components/CrossVendorCompareSection";
import {
  formatDate,
  formatMoney,
  STOCK_STATUS_LABEL,
  STOCK_STATUS_TONE,
  VENDOR_LABEL
} from "@/lib/format";

export const revalidate = 30;

interface PageProps {
  params: Promise<{ vendorKey: string; identityKey: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { vendorKey: rawVK, identityKey: rawIK } = await params;
  const vendorKey = safeDecodeParam(rawVK);
  const identityKey = safeDecodeParam(rawIK);

  let product;
  let history;
  let error: string | null = null;

  try {
    [product, history] = await Promise.all([
      getProduct(vendorKey, identityKey),
      getPriceHistory(vendorKey, identityKey, 90)
    ]);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
  }

  if (error || !product) {
    return (
      <main className="flex-grow w-full max-w-container-max mx-auto px-gutter pt-md pb-xl">
        <div className="border border-error rounded bg-error-container/40 p-md text-on-error-container">
          ไม่พบข้อมูลสินค้า: {error ?? "ไม่ทราบสาเหตุ"}
        </div>
      </main>
    );
  }

  const stock = product.stockStatus ?? "unknown";

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-gutter pt-md pb-xl flex flex-col gap-md">
      <Link
        href="/search"
        className="inline-flex items-center gap-xs text-on-surface-variant text-body-sm hover:text-primary transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับสู่ผลค้นหา
      </Link>

      <section className="border border-outline-variant rounded bg-surface-container-lowest p-md flex flex-col gap-sm">
        <div className="flex items-center justify-between gap-md">
          <span className="font-label-caps text-label-caps text-outline uppercase tracking-widest">
            {VENDOR_LABEL[product.vendorKey] ?? product.vendorKey} · {product.vendorName}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded font-label-caps text-label-caps uppercase ${
              STOCK_STATUS_TONE[stock] ?? STOCK_STATUS_TONE.unknown
            }`}
          >
            {STOCK_STATUS_LABEL[stock] ?? stock}
          </span>
        </div>
        <h1 className="font-h1 text-h1 text-on-surface">{product.rawName}</h1>
        {product.genericName && (
          <p className="text-body-md text-on-surface-variant">Generic: {product.genericName}</p>
        )}
        <div className="flex flex-wrap gap-md mt-sm">
          <Stat label="ราคา" value={`${formatMoney(product.price ?? null)} บาท`} />
          <Stat label="หน่วย" value={product.unit ?? "—"} />
          <Stat label="ขนาด" value={product.strength ?? product.packSize ?? "—"} />
          <Stat label="บาร์โค้ด" value={product.barcode ?? "—"} mono />
          <Stat label="รหัสร้าน" value={product.code ?? "—"} mono />
          <Stat label="เห็นล่าสุด" value={formatDate(product.lastSeenAt)} />
        </div>
        {product.sourceUrl && (
          <a
            className="inline-flex items-center gap-xs text-primary text-body-sm hover:underline mt-xs"
            href={product.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            เปิดที่หน้าร้าน
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-sm">
          <div>
            <p className="inline-flex items-center gap-xs font-label-caps text-label-caps text-outline uppercase tracking-widest">
              <LineChart className="h-3.5 w-3.5" />
              Price History · 90 days
            </p>
            <h2 className="font-h2 text-h2">ประวัติราคา</h2>
          </div>
          <span className="text-body-sm text-on-surface-variant">
            {history?.points.length ?? 0} จุดข้อมูล
          </span>
        </div>
        <PriceHistoryChart points={history?.points ?? []} />
      </section>

      {product.matchKey && (
        <section>
          <div className="flex items-baseline justify-between mb-sm flex-wrap gap-xs">
            <div>
              <p className="inline-flex items-center gap-xs font-label-caps text-label-caps text-outline uppercase tracking-widest">
                <Scale className="h-3.5 w-3.5" />
                Cross-vendor comparison · 3 brands
              </p>
              <h2 className="font-h2 text-h2">เปรียบเทียบราคาข้ามร้าน</h2>
            </div>
          </div>
          <Suspense fallback={<CrossVendorCompareSkeleton />}>
            <CrossVendorCompareSection
              matchKey={product.matchKey}
              currentVendor={product.vendorKey}
              currentIdentityKey={product.identityKey}
            />
          </Suspense>
        </section>
      )}
    </main>
  );
}

function Stat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-xs min-w-[140px]">
      <span className="font-label-caps text-label-caps text-outline uppercase tracking-widest">
        {label}
      </span>
      <span className={`text-body-md text-on-surface ${mono ? "font-mono text-[14px]" : ""}`}>
        {value}
      </span>
    </div>
  );
}
