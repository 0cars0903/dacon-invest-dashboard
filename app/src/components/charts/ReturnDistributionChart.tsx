"use client";

/**
 * 일간 수익률 분포 히스토그램
 * 시각화매핑규칙 §2-1 순서 4 대응
 */

import {
  BarChart,
  Bar,
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

export function ReturnDistributionChart({ calculation }: Props) {
  const dailyRet = calculation.indicators.find((i) => i.id === "daily_return");
  if (!dailyRet?.timeSeries) return null;

  const returns = dailyRet.timeSeries.values;
  if (returns.length < 10) return null;

  // 히스토그램 빈 생성 (20개 구간)
  const min = Math.min(...returns) * 100;
  const max = Math.max(...returns) * 100;
  const binCount = 20;
  const binWidth = (max - min) / binCount || 1;

  const bins: { range: string; count: number; midpoint: number }[] = [];
  for (let i = 0; i < binCount; i++) {
    const lo = min + i * binWidth;
    const hi = lo + binWidth;
    const count = returns.filter((r) => {
      const rv = r * 100;
      return i === binCount - 1 ? rv >= lo && rv <= hi : rv >= lo && rv < hi;
    }).length;
    bins.push({
      range: `${lo.toFixed(1)}%`,
      count,
      midpoint: (lo + hi) / 2,
    });
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        일간 수익률 분포
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={bins}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 9, fill: "#6B7280" }}
            interval={Math.floor(binCount / 5)}
          />
          <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} />
          <Tooltip
            formatter={(val) => [Number(val), "빈도"]}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <ReferenceLine x={findZeroBin(bins)} stroke="#9CA3AF" strokeDasharray="3 3" />
          <Bar
            dataKey="count"
            fill={COLORS.main[0]}
            fillOpacity={0.7}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function findZeroBin(
  bins: { range: string; midpoint: number }[]
): string | undefined {
  const closest = bins.reduce((prev, curr) =>
    Math.abs(curr.midpoint) < Math.abs(prev.midpoint) ? curr : prev
  );
  return closest.range;
}
