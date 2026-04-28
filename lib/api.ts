const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4444";

export interface SearchHit {
  id: string;
  vendorKey: string;
  vendorName: string;
  rawName: string;
  genericName?: string | null;
  matchKey: string;
  identityKey: string;
  unit?: string | null;
  price?: number | null;
  priceText?: string | null;
  stockStatus?: string | null;
  stockText?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  sourceUrl?: string | null;
  lastSeenAt?: string | null;
}

export interface FacetBucket {
  key: string;
  doc_count: number;
}

export interface RangeBucket {
  key: string;
  from?: number;
  to?: number;
  doc_count: number;
}

export interface SearchAggregations {
  vendors?: { buckets: FacetBucket[] };
  stockStatuses?: { buckets: FacetBucket[] };
  units?: { buckets: FacetBucket[] };
  priceRanges?: { buckets: RangeBucket[] };
}

export interface SearchResponse {
  total: number;
  page: number;
  size: number;
  hits: SearchHit[];
  aggregations: SearchAggregations;
}

export interface SearchQuery {
  q?: string;
  vendor?: string[];
  stockStatus?: string[];
  unit?: string[];
  priceMin?: number;
  priceMax?: number;
  sort?: "relevance" | "price_asc" | "price_desc" | "recent";
  page?: number;
  size?: number;
}

function toQuery(params: SearchQuery): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.vendor?.length) search.set("vendor", params.vendor.join(","));
  if (params.stockStatus?.length) search.set("stockStatus", params.stockStatus.join(","));
  if (params.unit?.length) search.set("unit", params.unit.join(","));
  if (params.priceMin !== undefined) search.set("priceMin", String(params.priceMin));
  if (params.priceMax !== undefined) search.set("priceMax", String(params.priceMax));
  if (params.sort) search.set("sort", params.sort);
  if (params.page) search.set("page", String(params.page));
  if (params.size) search.set("size", String(params.size));
  return search.toString();
}

interface FetchOptions extends Omit<RequestInit, "next"> {
  revalidate?: number | false;
}

async function fetchJson<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { revalidate = 10, ...rest } = options;
  const init: RequestInit & { next?: { revalidate?: number | false } } = {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...rest.headers
    }
  };
  if (revalidate === false) {
    init.cache = "no-store";
  } else {
    init.next = { revalidate };
  }

  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${await response.text()}`);
  }
  return (await response.json()) as T;
}

export function search(params: SearchQuery): Promise<SearchResponse> {
  const query = toQuery(params);
  return fetchJson<SearchResponse>(`/api/search${query ? `?${query}` : ""}`);
}

export interface SuggestHit {
  id: string;
  vendorKey: string;
  vendorName: string;
  rawName: string;
  genericName?: string | null;
  matchKey: string;
  identityKey: string;
  unit?: string | null;
  price?: number | null;
}

export function suggest(q: string): Promise<{ hits: SuggestHit[] }> {
  return fetchJson(`/api/suggest?q=${encodeURIComponent(q)}`, { revalidate: 30 });
}

export interface ProductDetail extends SearchHit {
  barcode?: string | null;
  code?: string | null;
  strength?: string | null;
  packSize?: string | null;
  normalizedName?: string;
  normalizedGenericName?: string | null;
  expiryDate?: string | null;
  expiryText?: string | null;
  firstSeenAt?: string | null;
  lastChangedAt?: string | null;
  raw?: Record<string, unknown>;
}

export function getProduct(vendorKey: string, identityKey: string): Promise<ProductDetail> {
  return fetchJson(`/api/products/${vendorKey}/${encodeURIComponent(identityKey)}`);
}

export interface PriceHistoryPoint {
  snapshotDay: string;
  snapshotDate: string;
  priceOpen: number | null;
  priceHigh: number | null;
  priceLow: number | null;
  priceClose: number | null;
  stockStatusClose: string;
  stockQtyClose: number | null;
}

export function getPriceHistory(
  vendorKey: string,
  identityKey: string,
  limit = 90
): Promise<{ vendorKey: string; identityKey: string; points: PriceHistoryPoint[] }> {
  return fetchJson(
    `/api/products/${vendorKey}/${encodeURIComponent(identityKey)}/history?limit=${limit}`,
    { revalidate: 60 }
  );
}

export type Vendor = "msk" | "somsak" | "sor";

export interface VendorMatch {
  matchType: "exact" | "similar";
  products?: ProductDetail[];
  product?: ProductDetail;
  score?: number;
}

export interface CompareResponse {
  matchKey: string;
  source: ProductDetail | null;
  synthesized: boolean;
  exactCount: number;
  vendorsCovered: number;
  cheapest: { vendorKey: Vendor; price: number; identityKey: string } | null;
  vendors: Record<Vendor, { matchType: "exact" | "similar" | "none"; products: ProductDetail[]; score?: number }>;
}

export function getCompare(matchKey: string): Promise<CompareResponse> {
  return fetchJson(`/api/compare/${encodeURIComponent(matchKey)}`);
}

/**
 * Build a browser-facing /compare/[matchKey] URL.
 * Uses "~" as separator instead of "|" so the URL doesn't contain "%7C".
 * The reverse (decode + ~→|) happens via safeDecodeMatchKey().
 */
export function buildCompareHref(matchKey: string): string {
  return `/compare/${encodeURIComponent(matchKey.replace(/\|/g, "~"))}`;
}

/**
 * Decode a Next.js dynamic-route matchKey param into the canonical "|"-separated form.
 * Handles cases where Next did and didn't auto-decode the URL component.
 */
export function safeDecodeMatchKey(rawParam: string): string {
  let decoded = rawParam;
  try {
    decoded = decodeURIComponent(rawParam);
  } catch {
    decoded = rawParam;
  }
  return decoded.replace(/~/g, "|");
}

/** Same idea for arbitrary string params (identityKey may already be decoded by Next). */
export function safeDecodeParam(rawParam: string): string {
  try {
    return decodeURIComponent(rawParam);
  } catch {
    return rawParam;
  }
}

export interface DrugGroup {
  matchKey: string;
  anchor: ProductDetail;
  score: number;
  vendors: Partial<Record<Vendor, { matchType: "exact" | "similar"; product: ProductDetail; score?: number }>>;
}

export interface SearchCompareResponse {
  query: string;
  total: number;
  groups: DrugGroup[];
  filters?: {
    vendor: string[];
    stockStatus: string[];
    priceMin?: number;
    priceMax?: number;
  };
}

export interface SearchCompareInput {
  q?: string;
  size?: number;
  vendor?: string[];
  stockStatus?: string[];
  priceMin?: number;
  priceMax?: number;
}

export function searchCompare(input: SearchCompareInput): Promise<SearchCompareResponse> {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.size) params.set("size", String(input.size));
  if (input.vendor?.length) params.set("vendor", input.vendor.join(","));
  if (input.stockStatus?.length) params.set("stockStatus", input.stockStatus.join(","));
  if (input.priceMin !== undefined) params.set("priceMin", String(input.priceMin));
  if (input.priceMax !== undefined) params.set("priceMax", String(input.priceMax));
  return fetchJson(`/api/search-compare?${params.toString()}`);
}
