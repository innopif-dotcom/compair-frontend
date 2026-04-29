"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

export type Vendor = "msk" | "somsak" | "sor";

export interface CartItem {
  matchKey: string;
  rawName: string;
  qty: number;
  pinnedVendor?: Vendor;
  addedAt: number;
}

const STORAGE_KEY = "drugcompare:cart";

function load(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is CartItem =>
        typeof x?.matchKey === "string" &&
        typeof x?.rawName === "string" &&
        typeof x?.qty === "number"
    );
  } catch {
    return [];
  }
}

function save(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  add: (item: { matchKey: string; rawName: string; qty?: number }) => void;
  remove: (matchKey: string) => void;
  setQty: (matchKey: string, qty: number) => void;
  setPinnedVendor: (matchKey: string, vendor: Vendor | undefined) => void;
  clear: () => void;
  has: (matchKey: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount only
  useEffect(() => {
    setItems(load());
    setHydrated(true);
  }, []);

  // Persist on every change after hydration
  useEffect(() => {
    if (hydrated) save(items);
  }, [items, hydrated]);

  // Cross-tab sync
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(load());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const add = useCallback<CartContextValue["add"]>(({ matchKey, rawName, qty = 1 }) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.matchKey === matchKey);
      if (existing) {
        return prev.map((p) =>
          p.matchKey === matchKey ? { ...p, qty: p.qty + qty } : p
        );
      }
      return [
        ...prev,
        { matchKey, rawName, qty, addedAt: Date.now() }
      ];
    });
  }, []);

  const remove = useCallback<CartContextValue["remove"]>((matchKey) => {
    setItems((prev) => prev.filter((p) => p.matchKey !== matchKey));
  }, []);

  const setQty = useCallback<CartContextValue["setQty"]>((matchKey, qty) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((p) => p.matchKey !== matchKey));
      return;
    }
    setItems((prev) =>
      prev.map((p) => (p.matchKey === matchKey ? { ...p, qty } : p))
    );
  }, []);

  const setPinnedVendor = useCallback<CartContextValue["setPinnedVendor"]>((matchKey, vendor) => {
    setItems((prev) =>
      prev.map((p) => (p.matchKey === matchKey ? { ...p, pinnedVendor: vendor } : p))
    );
  }, []);

  const clear = useCallback<CartContextValue["clear"]>(() => setItems([]), []);

  const has = useCallback<CartContextValue["has"]>(
    (matchKey) => items.some((p) => p.matchKey === matchKey),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({ items, count: items.length, add, remove, setQty, setPinnedVendor, clear, has }),
    [items, add, remove, setQty, setPinnedVendor, clear, has]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
