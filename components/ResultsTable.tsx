import Link from "next/link";
import { Inbox } from "lucide-react";
import { buildCompareHref, type SearchHit } from "@/lib/api";
import { formatMoney, STOCK_STATUS_LABEL, STOCK_STATUS_TONE, VENDOR_LABEL } from "@/lib/format";

interface Props {
  hits: SearchHit[];
}

export function ResultsTable({ hits }: Props) {
  if (hits.length === 0) {
    return (
      <div className="border border-outline-variant rounded bg-surface-container-lowest p-lg text-center text-on-surface-variant">
        <span className="inline-flex items-center gap-xs">
          <Inbox className="h-5 w-5" />
          ไม่พบข้อมูลที่ตรงกับการค้นหา
        </span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile: stacked cards */}
      <ul className="sm:hidden flex flex-col gap-xs">
        {hits.map((hit) => {
          const stock = hit.stockStatus ?? "unknown";
          return (
            <li
              key={hit.id}
              className="border border-outline-variant rounded bg-surface-container-lowest p-sm flex flex-col gap-xs"
            >
              <Link
                href={`/product/${hit.vendorKey}/${encodeURIComponent(hit.identityKey)}`}
                className="flex items-start justify-between gap-sm"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-medium text-on-surface line-clamp-2 leading-tight">
                    {hit.rawName}
                  </span>
                  {hit.genericName && (
                    <span className="text-on-surface-variant text-[12px] truncate">
                      {hit.genericName}
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-body-sm text-on-surface">
                    {formatMoney(hit.price ?? null)}
                  </div>
                  <div className="text-[11px] text-on-surface-variant">
                    {hit.unit ?? "—"}
                  </div>
                </div>
              </Link>
              <div className="flex items-center justify-between gap-xs flex-wrap">
                <span className="font-label-caps text-[10px] text-outline uppercase tracking-widest">
                  {VENDOR_LABEL[hit.vendorKey] ?? hit.vendorKey}
                </span>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded font-label-caps text-[9px] uppercase ${
                    STOCK_STATUS_TONE[stock] ?? STOCK_STATUS_TONE.unknown
                  }`}
                >
                  {STOCK_STATUS_LABEL[stock] ?? stock}
                </span>
                {hit.matchKey && (
                  <Link
                    href={buildCompareHref(hit.matchKey)}
                    className="text-[10px] text-primary uppercase tracking-widest font-label-caps hover:underline"
                  >
                    เทียบ →
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Desktop: full table */}
      <div className="hidden sm:block border border-outline-variant rounded bg-surface-container-lowest overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface border-b border-outline-variant">
            <tr>
              <th className="py-sm px-md font-label-caps text-label-caps text-on-surface-variant">
                ชื่อยา
              </th>
              <th className="py-sm px-md font-label-caps text-label-caps text-on-surface-variant">
                ร้าน
              </th>
              <th className="py-sm px-md font-label-caps text-label-caps text-on-surface-variant">
                หน่วย
              </th>
              <th className="py-sm px-md font-label-caps text-label-caps text-on-surface-variant text-right">
                ราคา
              </th>
              <th className="py-sm px-md font-label-caps text-label-caps text-on-surface-variant">
                สต๊อก
              </th>
              <th className="py-sm px-md font-label-caps text-label-caps text-on-surface-variant">
                Match
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant font-body-sm text-body-sm text-on-surface">
            {hits.map((hit) => {
              const stock = hit.stockStatus ?? "unknown";
              return (
                <tr key={hit.id} className="hover:bg-surface transition-colors group">
                  <td className="py-sm px-md align-top">
                    <Link
                      href={`/product/${hit.vendorKey}/${encodeURIComponent(hit.identityKey)}`}
                      className="font-medium group-hover:text-primary transition-colors"
                    >
                      {hit.rawName}
                    </Link>
                    {hit.genericName && (
                      <div className="text-on-surface-variant text-[13px]">{hit.genericName}</div>
                    )}
                  </td>
                  <td className="py-sm px-md align-top">
                    <span className="font-label-caps text-label-caps text-outline uppercase">
                      {VENDOR_LABEL[hit.vendorKey] ?? hit.vendorKey}
                    </span>
                    <div className="text-[12px] text-on-surface-variant">{hit.vendorName}</div>
                  </td>
                  <td className="py-sm px-md align-top">{hit.unit ?? "—"}</td>
                  <td className="py-sm px-md align-top text-right font-mono">
                    {formatMoney(hit.price ?? null)}
                  </td>
                  <td className="py-sm px-md align-top">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded font-label-caps text-[10px] uppercase ${
                        STOCK_STATUS_TONE[stock] ?? STOCK_STATUS_TONE.unknown
                      }`}
                    >
                      {STOCK_STATUS_LABEL[stock] ?? stock}
                    </span>
                    {hit.stockText && (
                      <div className="text-[12px] text-on-surface-variant">{hit.stockText}</div>
                    )}
                  </td>
                  <td className="py-sm px-md align-top">
                    {hit.matchKey ? (
                      <Link
                        href={buildCompareHref(hit.matchKey)}
                        className="text-primary text-[12px] font-mono hover:underline break-all"
                      >
                        {hit.matchKey.length > 60
                          ? `${hit.matchKey.slice(0, 60)}…`
                          : hit.matchKey}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
