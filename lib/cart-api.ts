const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4444";

export type Vendor = "msk" | "somsak" | "sor";

export interface VendorSlot {
  vendorKey: Vendor;
  product: {
    rawName: string;
    identityKey: string;
    price: number | null;
    unit: string | null;
    stockStatus: string;
  } | null;
  available: boolean;
}

export interface EnrichedCartItem {
  matchKey: string;
  qty: number;
  rawName: string | null;
  vendors: Record<Vendor, VendorSlot>;
}

export async function lookupCart(
  items: { matchKey: string; qty: number }[]
): Promise<{ items: EnrichedCartItem[] }> {
  if (items.length === 0) return { items: [] };
  const response = await fetch(`${API_BASE}/api/cart/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`cart lookup ${response.status}: ${await response.text()}`);
  }
  return response.json();
}
