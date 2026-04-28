"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Clock,
  Command,
  ExternalLink,
  History,
  Inbox,
  Layers,
  Loader2,
  Pill,
  Search as SearchIcon,
  Sparkles,
  Store,
  X
} from "lucide-react";
import { suggest, type SuggestHit, type Vendor } from "@/lib/api";
import { formatMoney, VENDOR_LABEL } from "@/lib/format";

type Tab = "all" | "drugs" | "vendors" | "recent";

const TABS: { key: Tab; label: string; Icon: typeof Layers }[] = [
  { key: "all", label: "All", Icon: Layers },
  { key: "drugs", label: "ยา", Icon: Pill },
  { key: "vendors", label: "ร้าน", Icon: Store },
  { key: "recent", label: "ล่าสุด", Icon: History }
];

const VENDORS_LIST: { key: Vendor; name: string; url: string }[] = [
  { key: "msk", name: "MSK / หมอยาสิริกร", url: "https://www.msk.co.th" },
  { key: "somsak", name: "Somsak Pharma", url: "https://www.somsakpharma.com/shop" },
  { key: "sor", name: "SOR Pharmacy / ส.เภสัชกร", url: "https://www.sorpharmacy.com" }
];

const SUGGESTIONS = ["paracetamol", "amoxicillin", "ibuprofen", "พารา 500", "cetirizine"];

const RECENT_KEY = "drugcompare:recent-searches";
const MAX_RECENT = 8;

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function pushRecent(query: string) {
  if (!query.trim() || typeof window === "undefined") return;
  const current = loadRecent();
  const next = [query, ...current.filter((q) => q !== query)].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* quota etc. — ignore */
  }
}

function clearRecent() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RECENT_KEY);
}

interface CommandPaletteContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  return ctx;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const value = useMemo<CommandPaletteContextValue>(
    () => ({
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((v) => !v)
    }),
    [isOpen]
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      {isOpen && <CommandPaletteDialog onClose={() => setIsOpen(false)} />}
    </CommandPaletteContext.Provider>
  );
}

type Item =
  | { kind: "action"; id: string; label: string; href: string }
  | { kind: "drug"; id: string; hit: SuggestHit }
  | { kind: "vendor"; id: string; vendorKey: Vendor; name: string; url: string }
  | { kind: "recent"; id: string; query: string };

function CommandPaletteDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [hits, setHits] = useState<SuggestHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // initial focus + load recent
  useEffect(() => {
    setRecent(loadRecent());
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, []);

  // debounced suggest fetch
  useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      setLoading(false);
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await suggest(query.trim());
        setHits(result.hits);
        setSelectedIndex(0);
      } catch (cause) {
        console.error("suggest failed", cause);
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query]);

  // build flat list based on tab + query
  const items = useMemo<Item[]>(() => {
    const list: Item[] = [];
    const trimmed = query.trim();

    if (trimmed && (tab === "all" || tab === "drugs")) {
      list.push({
        kind: "action",
        id: "act:search",
        label: `เปิดผลการค้นหาเทียบราคาสำหรับ "${trimmed}"`,
        href: `/search?q=${encodeURIComponent(trimmed)}`
      });
    }

    if (tab === "all" || tab === "drugs") {
      for (const hit of hits.slice(0, tab === "drugs" ? 12 : 6)) {
        list.push({ kind: "drug", id: `drug:${hit.id}`, hit });
      }
    }

    if (tab === "all" || tab === "vendors") {
      for (const v of VENDORS_LIST) {
        list.push({
          kind: "vendor",
          id: `vendor:${v.key}`,
          vendorKey: v.key,
          name: v.name,
          url: v.url
        });
      }
    }

    if ((tab === "all" || tab === "recent") && !trimmed && recent.length > 0) {
      for (const q of recent) {
        list.push({ kind: "recent", id: `recent:${q}`, query: q });
      }
    }

    return list;
  }, [tab, query, hits, recent]);

  // bound selectedIndex when items shrink
  useEffect(() => {
    if (selectedIndex >= items.length) setSelectedIndex(0);
  }, [items.length, selectedIndex]);

  const openProduct = useCallback(
    (hit: SuggestHit) => {
      router.push(`/product/${hit.vendorKey}/${encodeURIComponent(hit.identityKey)}`);
      onClose();
    },
    [router, onClose]
  );

  const selectItem = useCallback(
    (item: Item) => {
      const trimmed = query.trim();
      switch (item.kind) {
        case "action": {
          if (trimmed) pushRecent(trimmed);
          router.push(item.href);
          onClose();
          break;
        }
        case "drug": {
          // Default: take user to /search with this drug's term so they can compare across brands
          // (use genericName when available — broader match — else rawName).
          const term = item.hit.genericName?.trim() || item.hit.rawName;
          if (term) pushRecent(term);
          router.push(`/search?q=${encodeURIComponent(term)}`);
          onClose();
          break;
        }
        case "vendor": {
          window.open(item.url, "_blank", "noopener,noreferrer");
          break;
        }
        case "recent": {
          setQuery(item.query);
          setTab("all");
          inputRef.current?.focus();
          break;
        }
      }
    },
    [router, onClose, query]
  );

  // keyboard navigation (window-level so it works while focusing input)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (items.length === 0 ? 0 : Math.min(items.length - 1, i + 1)));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const idx = TABS.findIndex((t) => t.key === tab);
        const nextIdx = e.shiftKey
          ? (idx - 1 + TABS.length) % TABS.length
          : (idx + 1) % TABS.length;
        const nextTab = TABS[nextIdx]?.key ?? "all";
        setTab(nextTab);
        setSelectedIndex(0);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const it = items[selectedIndex];
        if (it) selectItem(it);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tab, items, selectedIndex, selectItem, onClose]);

  // scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx='${selectedIndex}']`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-md bg-on-surface/30 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-surface-container-lowest border border-outline-variant rounded-lg shadow-2xl overflow-hidden flex flex-col animate-scale-in">
        {/* search input */}
        <div className="flex items-center gap-sm px-md py-sm border-b border-outline-variant">
          <div className="flex items-center justify-center w-5 h-5">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <SearchIcon className="h-5 w-5 text-outline" />
            )}
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="พิมพ์ชื่อยา · ร้าน · บาร์โค้ด..."
            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-body-md text-on-surface placeholder:text-outline"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-outline hover:text-on-surface transition-colors"
              aria-label="Clear"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 rounded bg-surface-container border border-outline-variant text-[10px] font-mono text-on-surface-variant">
            Esc
          </kbd>
        </div>

        {/* tabs */}
        <div className="flex items-center gap-xs px-md py-xs border-b border-outline-variant overflow-x-auto">
          {TABS.map(({ key, label, Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setTab(key);
                  setSelectedIndex(0);
                }}
                className={`inline-flex items-center gap-xs px-sm py-xs rounded font-label-caps text-[11px] uppercase tracking-widest transition-colors whitespace-nowrap ${
                  active
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container"
                }`}
                type="button"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
          {tab === "recent" && recent.length > 0 && (
            <button
              onClick={() => {
                clearRecent();
                setRecent([]);
              }}
              className="ml-auto text-[10px] font-label-caps uppercase tracking-widest text-on-surface-variant hover:text-error transition-colors"
              type="button"
            >
              ล้าง
            </button>
          )}
        </div>

        {/* list */}
        <div ref={listRef} className="max-h-[55vh] overflow-y-auto py-xs">
          {items.length === 0 ? (
            <EmptyState query={query} onSelect={(q) => setQuery(q)} />
          ) : (
            items.map((item, idx) => (
              <CommandRow
                key={item.id}
                idx={idx}
                selected={idx === selectedIndex}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => selectItem(item)}
              >
                {item.kind === "action" && <ActionRow label={item.label} />}
                {item.kind === "drug" && (
                  <DrugRow
                    hit={item.hit}
                    query={query}
                    onOpenProduct={() => openProduct(item.hit)}
                  />
                )}
                {item.kind === "vendor" && <VendorRow vendorKey={item.vendorKey} name={item.name} />}
                {item.kind === "recent" && <RecentRow q={item.query} />}
              </CommandRow>
            ))
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-between gap-sm px-md py-xs border-t border-outline-variant text-[10px] font-label-caps text-outline uppercase tracking-widest">
          <span className="inline-flex items-center gap-xs flex-wrap">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            <span>Navigate</span>
            <span className="opacity-50">·</span>
            <Kbd>⏎</Kbd>
            <span>Search</span>
            <span className="opacity-50">·</span>
            <ArrowUpRight className="h-3 w-3" />
            <span>Detail</span>
            <span className="opacity-50">·</span>
            <Kbd>Tab</Kbd>
            <span>Tabs</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-xs">
            <Command className="h-3 w-3" />
            DrugCompare
          </span>
        </div>
      </div>
    </div>
  );
}

function CommandRow({
  idx,
  selected,
  children,
  onMouseEnter,
  onClick
}: {
  idx: number;
  selected: boolean;
  children: ReactNode;
  onMouseEnter: () => void;
  onClick: () => void;
}) {
  return (
    <div
      data-idx={idx}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      role="button"
      className={`mx-xs px-sm py-sm rounded cursor-pointer transition-colors ${
        selected
          ? "bg-primary/10 ring-1 ring-primary/30"
          : "hover:bg-surface-container"
      }`}
    >
      {children}
    </div>
  );
}

function ActionRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-sm">
      <span className="flex items-center justify-center h-7 w-7 rounded bg-primary/10 text-primary shrink-0">
        <SearchIcon className="h-4 w-4" />
      </span>
      <span className="text-body-md text-on-surface flex-1 min-w-0 truncate">{label}</span>
      <ArrowRight className="h-4 w-4 text-outline shrink-0" />
    </div>
  );
}

function DrugRow({
  hit,
  query,
  onOpenProduct
}: {
  hit: SuggestHit;
  query: string;
  onOpenProduct: () => void;
}) {
  return (
    <div className="flex items-center gap-sm">
      <span className="flex items-center justify-center h-7 w-7 rounded bg-secondary-container text-on-secondary-container shrink-0">
        <Pill className="h-4 w-4" />
      </span>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-body-md text-on-surface truncate">
          {highlightMatch(hit.rawName, query)}
        </span>
        {hit.genericName && (
          <span className="text-[12px] text-on-surface-variant truncate">
            {hit.genericName}
          </span>
        )}
      </div>
      <div className="flex items-center gap-sm whitespace-nowrap text-body-sm text-on-surface-variant shrink-0">
        <span className="font-label-caps text-[10px] text-outline uppercase">
          {VENDOR_LABEL[hit.vendorKey] ?? hit.vendorKey}
        </span>
        <span className="font-mono">฿{formatMoney(hit.price ?? null)}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenProduct();
          }}
          aria-label={`เปิดรายละเอียด ${hit.rawName}`}
          title="เปิดหน้าสินค้า"
          className="ml-xs flex items-center justify-center h-7 w-7 rounded border border-outline-variant bg-surface text-outline hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function VendorRow({ vendorKey, name }: { vendorKey: Vendor; name: string }) {
  return (
    <div className="flex items-center gap-sm">
      <span className="flex items-center justify-center h-7 w-7 rounded bg-tertiary-fixed text-on-tertiary-fixed shrink-0">
        <Store className="h-4 w-4" />
      </span>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-body-md text-on-surface truncate">{name}</span>
        <span className="text-[12px] text-on-surface-variant font-mono">เปิดเว็บ · {vendorKey}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-outline shrink-0" />
    </div>
  );
}

function RecentRow({ q }: { q: string }) {
  return (
    <div className="flex items-center gap-sm">
      <span className="flex items-center justify-center h-7 w-7 rounded bg-surface-container text-on-surface-variant shrink-0">
        <Clock className="h-4 w-4" />
      </span>
      <span className="text-body-md text-on-surface flex-1 truncate">{q}</span>
      <span className="text-[10px] font-label-caps text-outline uppercase tracking-widest shrink-0">
        ค้นซ้ำ
      </span>
    </div>
  );
}

function EmptyState({ query, onSelect }: { query: string; onSelect: (q: string) => void }) {
  if (query.trim()) {
    return (
      <div className="px-md py-lg text-center text-on-surface-variant">
        <Inbox className="h-6 w-6 mx-auto mb-xs" />
        <p className="text-body-sm">ไม่พบผลลัพธ์</p>
      </div>
    );
  }
  return (
    <div className="px-md py-md flex flex-col gap-sm">
      <p className="text-[10px] font-label-caps text-outline uppercase tracking-widest">
        ลองค้นหา
      </p>
      <div className="flex flex-wrap gap-xs">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSelect(s)}
            className="inline-flex items-center gap-xs px-sm py-xs border border-outline-variant rounded text-body-sm text-on-surface hover:bg-surface-container hover:border-primary/40 transition-colors"
            type="button"
          >
            <Sparkles className="h-3 w-3 text-primary" />
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded bg-surface-container border border-outline-variant text-[10px] font-mono text-on-surface-variant">
      {children}
    </kbd>
  );
}

function highlightMatch(text: string, query: string): ReactNode {
  const trimmed = query.trim();
  if (!trimmed) return text;
  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/20 text-primary rounded px-0.5">
        {text.slice(idx, idx + lowerQuery.length)}
      </mark>
      {text.slice(idx + lowerQuery.length)}
    </>
  );
}
