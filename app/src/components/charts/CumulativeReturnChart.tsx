"use client";

/**
 * 누적 수익률 영역 차트
 * 시각화매핑규칙 §2-1 순서 2 대응
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { CalculationResult } from "@/types";
import { COLORS } from "@/types/visualization";

interface Props {
  calculation: CalculationResult;
}

export function CumulativeReturnChart({ calculation }: Props) {
  const ind = calculation.indicators.find((i) => i.id === "cumulative_return");
  if (!ind?.timeSeries) return null;

  const data = ind.timeSeries.dates.map((date, idx) => ({
    date: formatDate(date),
    value: Number((ind.timeSeries!.values[idx] * 100).toFixed(2)),
  }));

  const lastVal = data[data.length - 1]?.value ?? 0;
  const fillColor = lastVal >= 0 ? COLORS.up : COLORS.down;
  const strokeColor = lastVal >= 0 ? COLORS.up : COLORS.down;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">누적 수익률</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#6B7280" }}
            interval="preserveStartEnd"
            tickCount={6}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            formatter={(val) => [`${Number(val).toFixed(2)}%`, "누적 수익률"]}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <ReferenceLine y={0} stroke="#9CA3AF" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            fill={fillColor}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatDate(d: string): string {
  if (!d) return "";
  const parts = d.split("-");
  if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
  return d.length > 10 ? d.slice(5, 10) : d;
}
