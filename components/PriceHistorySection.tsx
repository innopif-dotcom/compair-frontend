import { getCompare, getPriceHistory, type Vendor } from "@/lib/api";
import { PriceHistoryChart, type PriceHistorySeries } from "./PriceHistoryChart";
import { VENDOR_LABEL } from "@/lib/format";

const VENDORS: Vendor[] = ["msk", "somsak", "sor"];

interface Props {
  matchKey: string;
  currentVendor: string;
  currentIdentityKey: string;
}

/**
 * Server component that fetches the current product's price history plus the
 * other two vendors' best-match products' histories, then renders a multi-line
 * chart so users can see all 3 brands' price trajectories together.
 */
export async function PriceHistorySection({
  matchKey,
  currentVendor,
  currentIdentityKey
}: Props) {
  let compare;
  try {
    compare = await getCompare(matchKey);
  } catch {
    compare = null;
  }

  const refs: Array<{ vendor: Vendor; identityKey: string; label: string; isCurrent: boolean }> = [];

  for (const vendor of VENDORS) {
    const slot = compare?.vendors[vendor];
    const product = slot?.products[0];
    if (product) {
      refs.push({
        vendor,
        identityKey: product.identityKey,
        label: `${VENDOR_LABEL[vendor]}${slot.matchType === "similar" ? " (≈)" : ""}`,
        isCurrent: vendor === currentVendor && product.identityKey === currentIdentityKey
      });
    }
  }

  // Always include the current product (in case compare didn't surface it for some reason)
  if (!refs.find((r) => r.vendor === currentVendor && r.identityKey === currentIdentityKey)) {
    refs.push({
      vendor: currentVendor as Vendor,
      identityKey: currentIdentityKey,
      label: VENDOR_LABEL[currentVendor as Vendor] ?? currentVendor,
      isCurrent: true
    });
  }

  const series: PriceHistorySeries[] = await Promise.all(
    refs.map(async (ref) => {
      try {
        const history = await getPriceHistory(ref.vendor, ref.identityKey, 90);
        return {
          vendor: ref.vendor,
          label: ref.label,
          points: history.points,
          isCurrent: ref.isCurrent
        };
      } catch {
        return { vendor: ref.vendor, label: ref.label, points: [], isCurrent: ref.isCurrent };
      }
    })
  );

  const totalPoints = series.reduce((sum, s) => sum + s.points.length, 0);

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex items-center justify-between flex-wrap gap-xs">
        <span className="text-body-sm text-on-surface-variant">
          แสดงราคาย้อนหลัง 90 วันของ {series.filter((s) => s.points.length > 0).length} ร้าน
        </span>
        <span className="text-[12px] text-on-surface-variant">
          {totalPoints} จุดข้อมูลรวม
        </span>
      </div>
      <PriceHistoryChart series={series} />
    </div>
  );
}
