"use client";

/**
 * RSI 라인 차트
 * 시각화매핑규칙 §2-1 순서 6 대응
 */

import {
  LineChart,
  Line,
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

export function RSIChart({ calculation }: Props) {
  // RSI는 단일 값이므로, 일간 수익률 시계열로 롤링 RSI를 근사 계산
  const dailyRet = calculation.indicators.find((i) => i.id === "daily_return");
  if (!dailyRet?.timeSeries) return null;

  const returns = dailyRet.timeSeries.values;
  const dates = dailyRet.timeSeries.dates;
  const period = 14;
  if (returns.length < period + 5) return null;

  // 롤링 RSI 계산
  const rsiData: { date: string; rsi: number }[] = [];
  for (let i = period; i < returns.length; i++) {
    const window = returns.slice(i - period, i);
    const gains = window.filter((r) => r > 0);
    const losses = window.filter((r) => r < 0).map((r) => Math.abs(r));
    const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    rsiData.push({
      date: formatDate(dates[i]),
      rsi: Number(rsi.toFixed(1)),
    });
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">RSI (14)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={rsiData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#6B7280" }}
            interval="preserveStartEnd"
            tickCount={5}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#6B7280" }}
            ticks={[0, 30, 50, 70, 100]}
          />
          <Tooltip
            formatter={(val) => [Number(val), "RSI"]}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <ReferenceLine y={70} stroke={COLORS.down} strokeDasharray="3 3" label={{ value: "과매수", fontSize: 10, fill: COLORS.down }} />
          <ReferenceLine y={30} stroke={COLORS.up} strokeDasharray="3 3" label={{ value: "과매도", fontSize: 10, fill: COLORS.up }} />
          <Line
            type="monotone"
            dataKey="rsi"
            stroke={COLORS.main[0]}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatDate(d: string): string {
  const parts = d.split("-");
  if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
  return d.length > 10 ? d.slice(5, 10) : d;
}
