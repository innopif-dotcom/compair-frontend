"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { PriceHistoryPoint, Vendor } from "@/lib/api";
import { VENDOR_LABEL } from "@/lib/format";

export interface PriceHistorySeries {
  vendor: Vendor;
  label?: string;
  points: PriceHistoryPoint[];
  isCurrent?: boolean;
}

interface Props {
  series: PriceHistorySeries[];
}

const VENDOR_COLORS: Record<Vendor, string> = {
  msk: "#0f1e2c", // primary
  somsak: "#436464", // secondary
  sor: "#a87038" // tertiary-ish (warm)
};

const VENDOR_DASH: Record<Vendor, string | undefined> = {
  msk: undefined,
  somsak: undefined,
  sor: undefined
};

interface MergedRow {
  snapshotDay: string;
  msk?: number | null;
  somsak?: number | null;
  sor?: number | null;
}

function mergePoints(series: PriceHistorySeries[]): MergedRow[] {
  const map = new Map<string, MergedRow>();
  for (const s of series) {
    for (const p of s.points) {
      const key = p.snapshotDay;
      if (!map.has(key)) {
        map.set(key, { snapshotDay: key });
      }
      const row = map.get(key)!;
      row[s.vendor] = p.priceClose ?? null;
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.snapshotDay.localeCompare(b.snapshotDay)
  );
}

export function PriceHistoryChart({ series }: Props) {
  const active = series.filter((s) => s.points.length > 0);

  if (active.length === 0) {
    return (
      <div className="border border-outline-variant rounded p-lg text-center text-on-surface-variant text-sm">
        ยังไม่มีข้อมูลประวัติราคาสำหรับสินค้านี้
      </div>
    );
  }

  const merged = mergePoints(active);

  return (
    <div className="border border-outline-variant rounded bg-surface-container-lowest p-sm sm:p-md">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={merged} margin={{ top: 12, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="#e2e2e2" strokeDasharray="3 3" />
          <XAxis
            dataKey="snapshotDay"
            tick={{ fontSize: 11 }}
            stroke="#74777c"
            tickFormatter={(value: string) => value.slice(5)}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke="#74777c"
            width={48}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 4,
              borderColor: "#c4c6cc",
              fontSize: 12,
              backgroundColor: "rgba(255,255,255,0.95)"
            }}
            labelFormatter={(label: string) => `วันที่ ${label}`}
            formatter={(value: number, name: string) => {
              if (value === null || value === undefined) return ["—", name];
              return [`฿${value.toLocaleString("th-TH")}`, name];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            iconType="line"
          />
          {active.map((s) => (
            <Line
              key={s.vendor}
              type="monotone"
              dataKey={s.vendor}
              name={s.label ?? VENDOR_LABEL[s.vendor]}
              stroke={VENDOR_COLORS[s.vendor]}
              strokeWidth={s.isCurrent ? 3 : 2}
              strokeDasharray={VENDOR_DASH[s.vendor]}
              dot={{ r: s.isCurrent ? 3 : 2 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
