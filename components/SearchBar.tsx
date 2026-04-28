"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ExternalLink, Loader2, Search } from "lucide-react";
import { suggest, type SuggestHit } from "@/lib/api";
import { formatMoney, VENDOR_LABEL } from "@/lib/format";

interface Props {
  initialValue?: string;
  size?: "lg" | "md";
}

export function SearchBar({ initialValue = "", size = "lg" }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(initialValue);
  const [hits, setHits] = useState<SuggestHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef<AbortController | null>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (!value.trim()) {
      setHits([]);
      setLoading(false);
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      // Cancel previous in-flight request to avoid stale results
      inflight.current?.abort();
      inflight.current = new AbortController();
      setLoading(true);
      try {
        const result = await suggest(value.trim());
        setHits(result.hits);
        setOpen(true);
      } catch (cause) {
        if ((cause as Error).name !== "AbortError") {
          console.error("suggest failed", cause);
        }
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [value]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  function submit() {
    const next = new URLSearchParams(params?.toString() ?? "");
    if (value.trim()) {
      next.set("q", value.trim());
    } else {
      next.delete("q");
    }
    next.delete("page");
    router.push(`/search${next.toString() ? `?${next.toString()}` : ""}`);
    setOpen(false);
  }

  const padY = size === "lg" ? "py-md" : "py-sm";
  const fontClass = size === "lg" ? "text-body-lg" : "text-body-md";

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="w-full flex items-center bg-surface-container-lowest border border-outline-variant rounded focus-within:border-primary transition-colors">
        <div className="ml-sm mr-xs flex items-center justify-center w-5 h-5">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <Search className="h-5 w-5 text-outline" />
          )}
        </div>
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => setOpen(hits.length > 0)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submit();
            if (event.key === "Escape") setOpen(false);
          }}
          className={`flex-grow bg-transparent border-none focus:outline-none focus:ring-0 ${fontClass} text-on-surface ${padY} px-xs placeholder:text-outline-variant`}
          placeholder="ค้นหายาด้วยชื่อสามัญ ชื่อการค้า บาร์โค้ด หรือร้าน..."
          type="text"
        />
        <button
          onClick={submit}
          className={`bg-primary text-on-primary font-label-caps text-label-caps h-full px-lg ${padY} rounded-r hover:bg-primary-container transition-colors border border-primary`}
        >
          SEARCH
        </button>
      </div>

      {open && hits.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-surface-container-lowest border border-outline-variant rounded shadow-sm divide-y divide-outline-variant max-h-[400px] overflow-y-auto">
          {hits.map((hit) => {
            const searchTerm = hit.genericName?.trim() || hit.rawName;
            return (
              <li key={hit.id} className="flex items-stretch hover:bg-surface group">
                <button
                  type="button"
                  className="flex-1 min-w-0 px-md py-sm text-left"
                  onClick={() => {
                    router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
                    setOpen(false);
                  }}
                  title={`ค้นหา "${searchTerm}" ในทุกร้าน`}
                >
                  <div className="flex items-center justify-between gap-sm">
                    <div className="flex flex-col min-w-0">
                      <span className="text-body-md text-on-surface truncate">
                        {hit.rawName}
                      </span>
                      {hit.genericName && (
                        <span className="text-body-sm text-on-surface-variant truncate">
                          {hit.genericName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-sm text-body-sm text-on-surface-variant whitespace-nowrap">
                      <span className="font-label-caps text-label-caps text-outline">
                        {VENDOR_LABEL[hit.vendorKey] ?? hit.vendorKey}
                      </span>
                      <span className="font-mono">{formatMoney(hit.price ?? null)}</span>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  className="px-sm flex items-center justify-center text-outline hover:text-primary hover:bg-surface-container border-l border-outline-variant transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(
                      `/product/${hit.vendorKey}/${encodeURIComponent(hit.identityKey)}`
                    );
                    setOpen(false);
                  }}
                  aria-label={`เปิดรายละเอียด ${hit.rawName}`}
                  title="เปิดหน้าสินค้า"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </li>
            );
          })}
          <li className="px-md py-xs text-[10px] font-label-caps text-outline uppercase tracking-widest border-t border-outline-variant bg-surface-container/40">
            <span className="inline-flex items-center gap-xs">
              <Search className="h-3 w-3" />
              คลิกแถว = ค้นหา
              <span className="opacity-50">·</span>
              <ExternalLink className="h-3 w-3" />
              คลิกลูกศร = เปิดสินค้า
            </span>
          </li>
        </ul>
      )}
    </div>
  );
}
