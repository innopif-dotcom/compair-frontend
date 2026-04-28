"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { PriceHistoryPoint } from "@/lib/api";

interface Props {
  points: PriceHistoryPoint[];
}

export function PriceHistoryChart({ points }: Props) {
  if (points.length === 0) {
    return (
      <div className="border border-outline-variant rounded p-lg text-center text-on-surface-variant">
        ยังไม่มีข้อมูลประวัติราคาสำหรับสินค้านี้
      </div>
    );
  }

  return (
    <div className="border border-outline-variant rounded bg-surface-container-lowest p-md">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="#e2e2e2" strokeDasharray="3 3" />
          <XAxis dataKey="snapshotDay" tick={{ fontSize: 12 }} stroke="#74777c" />
          <YAxis tick={{ fontSize: 12 }} stroke="#74777c" width={56} />
          <Tooltip
            contentStyle={{
              borderRadius: 4,
              borderColor: "#c4c6cc",
              fontSize: 12
            }}
            formatter={(value: number) => [`${value?.toLocaleString("th-TH")} บาท`, "ราคา"]}
          />
          <Line
            type="monotone"
            dataKey="priceClose"
            stroke="#0f1e2c"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
