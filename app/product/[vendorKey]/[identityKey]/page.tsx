import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink, LineChart, Scale } from "lucide-react";
import { getProduct, safeDecodeParam } from "@/lib/api";
import { PriceHistorySection } from "@/components/PriceHistorySection";
import {
  CrossVendorCompareSection,
  CrossVendorCompareSkeleton
} from "@/components/CrossVendorCompareSection";
import { Skeleton } from "@/components/Skeleton";
import { AddToCartButton } from "@/components/AddToCartButton";
import {
  formatDate,
  formatMoney,
  STOCK_STATUS_LABEL,
  STOCK_STATUS_TONE,
  VENDOR_LABEL
} from "@/lib/format";
import { buildMetadata, jsonLdScript } from "@/lib/seo";

export const revalidate = 30;

interface PageProps {
  params: Promise<{ vendorKey: string; identityKey: string }>;
}

const STOCK_AVAILABILITY: Record<string, string> = {
  in_stock: "https://schema.org/InStock",
  low_stock: "https://schema.org/LimitedAvailability",
  out_of_stock: "https://schema.org/OutOfStock",
  unknown: "https://schema.org/InStock"
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { vendorKey: rawVK, identityKey: rawIK } = await params;
  const vendorKey = safeDecodeParam(rawVK);
  const identityKey = safeDecodeParam(rawIK);
  try {
    const product = await getProduct(vendorKey, identityKey);
    const vendorLabel = VENDOR_LABEL[product.vendorKey] ?? product.vendorKey;
    const priceText = product.price ? `฿${formatMoney(product.price)}` : "ราคา-";
    return buildMetadata({
      title: `${product.rawName} ${priceText} ที่ ${vendorLabel}`,
      description: `${product.rawName}${product.genericName ? ` (generic: ${product.genericName})` : ""} ราคา ${priceText} จากร้าน ${product.vendorName} — เทียบกับ MSK · Somsak · SOR ในหน้าเดียว`,
      path: `/product/${vendorKey}/${encodeURIComponent(identityKey)}`
    });
  } catch {
    return buildMetadata({
      title: "ไม่พบสินค้า",
      noindex: true
    });
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { vendorKey: rawVK, identityKey: rawIK } = await params;
  const vendorKey = safeDecodeParam(rawVK);
  const identityKey = safeDecodeParam(rawIK);

  let product;
  let error: string | null = null;

  try {
    product = await getProduct(vendorKey, identityKey);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
  }

  if (error || !product) {
    return (
      <main className="flex-grow w-full max-w-container-max mx-auto px-sm sm:px-gutter pt-md pb-xl">
        <div className="border border-error rounded bg-error-container/40 p-md text-on-error-container">
          ไม่พบข้อมูลสินค้า: {error ?? "ไม่ทราบสาเหตุ"}
        </div>
      </main>
    );
  }

  const stock = product.stockStatus ?? "unknown";

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.rawName,
    description: product.genericName
      ? `${product.rawName} (generic: ${product.genericName})`
      : product.rawName,
    image: product.imageUrl ?? undefined,
    brand: { "@type": "Brand", name: product.vendorName },
    sku: product.code ?? product.identityKey,
    gtin: product.barcode ?? undefined,
    offers: {
      "@type": "Offer",
      price: product.price ?? undefined,
      priceCurrency: "THB",
      availability: STOCK_AVAILABILITY[stock] ?? "https://schema.org/InStock",
      url: product.sourceUrl ?? undefined,
      seller: { "@type": "Organization", name: product.vendorName }
    }
  };

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-sm sm:px-gutter pt-md pb-xl flex flex-col gap-md">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(productJsonLd)}
      />
      <Link
        href="/search"
        className="inline-flex items-center gap-xs text-on-surface-variant text-body-sm hover:text-primary transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับสู่ผลค้นหา
      </Link>

      <section className="border border-outline-variant rounded bg-surface-container-lowest p-sm sm:p-md flex flex-col gap-sm">
        <div className="flex items-center justify-between gap-sm flex-wrap">
          <span className="font-label-caps text-[10px] sm:text-label-caps text-outline uppercase tracking-widest">
            {VENDOR_LABEL[product.vendorKey] ?? product.vendorKey} · {product.vendorName}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded font-label-caps text-[10px] sm:text-label-caps uppercase ${
              STOCK_STATUS_TONE[stock] ?? STOCK_STATUS_TONE.unknown
            }`}
          >
            {STOCK_STATUS_LABEL[stock] ?? stock}
          </span>
        </div>
        <h1 className="font-h1 text-[24px] sm:text-h1 leading-tight text-on-surface">{product.rawName}</h1>
        {product.genericName && (
          <p className="text-body-md text-on-surface-variant">Generic: {product.genericName}</p>
        )}
        <div className="flex flex-wrap gap-sm sm:gap-md mt-sm">
          <Stat label="ราคา" value={`${formatMoney(product.price ?? null)} บาท`} />
          <Stat label="หน่วย" value={product.unit ?? "—"} />
          <Stat label="ขนาด" value={product.strength ?? product.packSize ?? "—"} />
          <Stat label="บาร์โค้ด" value={product.barcode ?? "—"} mono />
          <Stat label="รหัสร้าน" value={product.code ?? "—"} mono />
          <Stat label="เห็นล่าสุด" value={formatDate(product.lastSeenAt)} />
        </div>
        {product.matchKey && (
          <div className="mt-xs">
            <AddToCartButton
              matchKey={product.matchKey}
              rawName={product.rawName}
              size="md"
              variant="text"
            />
          </div>
        )}
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
        <div className="mb-sm">
          <p className="inline-flex items-center gap-xs font-label-caps text-label-caps text-outline uppercase tracking-widest">
            <LineChart className="h-3.5 w-3.5" />
            Price History · 90 days · 3 brands
          </p>
          <h2 className="font-h2 text-h2">ประวัติราคา 3 ร้าน</h2>
        </div>
        {product.matchKey ? (
          <Suspense fallback={<Skeleton className="h-[340px] w-full" />}>
            <PriceHistorySection
              matchKey={product.matchKey}
              currentVendor={product.vendorKey}
              currentIdentityKey={product.identityKey}
            />
          </Suspense>
        ) : (
          <div className="border border-outline-variant rounded p-lg text-center text-on-surface-variant text-sm">
            สินค้านี้ยังไม่มี matchKey สำหรับเทียบข้ามร้าน
          </div>
        )}
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
    <div className="flex flex-col gap-xs min-w-[120px] sm:min-w-[140px]">
      <span className="font-label-caps text-label-caps text-outline uppercase tracking-widest">
        {label}
      </span>
      <span className={`text-body-md text-on-surface break-words ${mono ? "font-mono text-[13px] sm:text-[14px]" : ""}`}>
        {value}
      </span>
    </div>
  );
}
