"use client";

/**
 * 누적 수익률 차트
 * 시각화매핑규칙 §2-1 순서 2 대응
 *
 * - STOCK_TS: 단일 Area 차트 (기존)
 * - ETF_COMP: 티커별 멀티라인 + 범례 (normalizedPrices 기반 Base-100)
 */

import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import type { CalculationResult } from "@/types";
import { COLORS } from "@/types/visualization";

interface Props {
  calculation: CalculationResult;
}

/** ETF_COMP 멀티라인: normalizedPrices → 병합 데이터 */
function ETFMultiLineChart({ calculation }: Props) {
  const np = calculation.normalizedPrices;
  if (!np || np.length === 0) return null;

  // 날짜 기준으로 모든 티커 데이터를 병합
  const dateSet = new Set<string>();
  np.forEach((t) => t.dates.forEach((d) => dateSet.add(d)));
  const allDates = Array.from(dateSet).sort();

  const data = allDates.map((date) => {
    const row: Record<string, string | number> = { date: formatDate(date) };
    np.forEach((t) => {
      const idx = t.dates.indexOf(date);
      if (idx !== -1) {
        row[t.ticker] = Number(t.values[idx].toFixed(2));
      }
    });
    return row;
  });

  const tickers = np.map((t) => t.ticker);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-slate-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
        비교 수익률 (Base-100)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#6B7280" }}
            interval="preserveStartEnd"
            tickCount={6}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickFormatter={(v: number) => `${v}`}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(val, name) => [
              typeof val === "number" ? val.toFixed(2) : String(val),
              String(name),
            ]}
          />
          <ReferenceLine
            y={100}
            stroke="#9CA3AF"
            strokeDasharray="3 3"
            label={{ value: "기준 100", position: "right", fontSize: 10, fill: "#9CA3AF" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            iconType="line"
          />
          {tickers.map((ticker, i) => (
            <Line
              key={ticker}
              type="monotone"
              dataKey={ticker}
              stroke={COLORS.main[i % COLORS.main.length]}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** STOCK_TS 단일 누적수익률 Area */
function SingleCumulativeChart({ calculation }: Props) {
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
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-slate-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
        누적 수익률
      </h3>
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

export function CumulativeReturnChart({ calculation }: Props) {
  // ETF_COMP: normalizedPrices가 있으면 멀티라인
  if (
    calculation.dataType === "ETF_COMP" &&
    calculation.normalizedPrices &&
    calculation.normalizedPrices.length > 1
  ) {
    return <ETFMultiLineChart calculation={calculation} />;
  }

  // 기본: 단일 누적 수익률
  return <SingleCumulativeChart calculation={calculation} />;
}

function formatDate(d: string): string {
  if (!d) return "";
  const parts = d.split("-");
  if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
  return d.length > 10 ? d.slice(5, 10) : d;
}
