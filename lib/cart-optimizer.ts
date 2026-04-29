import type { EnrichedCartItem, Vendor, VendorSlot } from "./cart-api";

const VENDORS: Vendor[] = ["msk", "somsak", "sor"];

export interface OptimizeRow {
  matchKey: string;
  rawName: string;
  qty: number;
  pickedVendor: Vendor | null;
  pickedPrice: number | null;
  pickedTotal: number;
  vendors: Record<Vendor, VendorSlot>;
  pinnedVendor?: Vendor;
}

export interface OptimizeSummary {
  rows: OptimizeRow[];
  totals: {
    bySplit: number;
    byVendor: Record<Vendor, number>;
    cheapestSingleVendor: { vendor: Vendor; total: number } | null;
    saving: number;
  };
  perVendorBreakdown: Record<Vendor, OptimizeRow[]>;
  unmatchedCount: number;
}

interface InputItem {
  matchKey: string;
  qty: number;
  rawName: string;
  pinnedVendor?: Vendor;
}

/**
 * Greedy split: for each item, pick cheapest vendor where the product is
 * available (in stock + has a price). User can override via pinnedVendor.
 *
 * Phase 1 ignores shipping/minimums — purely per-item cheapest. Phase 2
 * will add knapsack constraints.
 */
export function optimizeCart(
  cartItems: InputItem[],
  enriched: EnrichedCartItem[]
): OptimizeSummary {
  const enrichedMap = new Map(enriched.map((e) => [e.matchKey, e]));

  const rows: OptimizeRow[] = cartItems.map((cart) => {
    const data = enrichedMap.get(cart.matchKey);
    const vendors: Record<Vendor, VendorSlot> = data
      ? data.vendors
      : {
          msk: { vendorKey: "msk", product: null, available: false },
          somsak: { vendorKey: "somsak", product: null, available: false },
          sor: { vendorKey: "sor", product: null, available: false }
        };

    let picked: Vendor | null = null;
    let pickedPrice: number | null = null;

    if (cart.pinnedVendor && vendors[cart.pinnedVendor]?.available) {
      picked = cart.pinnedVendor;
      pickedPrice = vendors[cart.pinnedVendor].product?.price ?? null;
    } else {
      const candidates = VENDORS.filter(
        (v) => vendors[v].available && typeof vendors[v].product?.price === "number"
      );
      candidates.sort(
        (a, b) =>
          (vendors[a].product!.price as number) - (vendors[b].product!.price as number)
      );
      if (candidates.length > 0) {
        picked = candidates[0]!;
        pickedPrice = vendors[picked].product!.price;
      }
    }

    return {
      matchKey: cart.matchKey,
      rawName: cart.rawName,
      qty: cart.qty,
      pickedVendor: picked,
      pickedPrice,
      pickedTotal: pickedPrice ? pickedPrice * cart.qty : 0,
      vendors,
      pinnedVendor: cart.pinnedVendor
    };
  });

  const bySplit = rows.reduce((sum, r) => sum + r.pickedTotal, 0);

  // Per-vendor totals — only count rows where THAT vendor has a price.
  const byVendor: Record<Vendor, number> = { msk: 0, somsak: 0, sor: 0 };
  for (const v of VENDORS) {
    byVendor[v] = rows.reduce((sum, r) => {
      const p = r.vendors[v].product?.price;
      return sum + (typeof p === "number" ? p * r.qty : 0);
    }, 0);
  }

  // Cheapest "all from one vendor" baseline — only consider vendors that
  // actually carry every line (otherwise the comparison is unfair).
  let cheapestSingleVendor: { vendor: Vendor; total: number } | null = null;
  for (const v of VENDORS) {
    const carriesAll = rows.every(
      (r) => r.vendors[v].available && typeof r.vendors[v].product?.price === "number"
    );
    if (!carriesAll) continue;
    if (cheapestSingleVendor === null || byVendor[v] < cheapestSingleVendor.total) {
      cheapestSingleVendor = { vendor: v, total: byVendor[v] };
    }
  }

  const perVendorBreakdown: Record<Vendor, OptimizeRow[]> = {
    msk: [],
    somsak: [],
    sor: []
  };
  for (const r of rows) {
    if (r.pickedVendor) perVendorBreakdown[r.pickedVendor].push(r);
  }

  return {
    rows,
    totals: {
      bySplit,
      byVendor,
      cheapestSingleVendor,
      saving: cheapestSingleVendor ? cheapestSingleVendor.total - bySplit : 0
    },
    perVendorBreakdown,
    unmatchedCount: rows.filter((r) => r.pickedVendor === null).length
  };
}
