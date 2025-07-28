// components/product/PriceChart.tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PriceRecord } from "@/types/monitoredItem";

type Props = {
  data: PriceRecord[];
};

export const PriceChart = ({ data }: Props) => {
  // ソートしてから描画（念のため）
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sortedData}>
          <XAxis dataKey="date" fontSize={12} />
          <YAxis fontSize={12} tickFormatter={(v) => `¥${v}`} />
          <Tooltip
            formatter={(value: number) => `¥${value.toLocaleString()}`}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#4F46E5"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
