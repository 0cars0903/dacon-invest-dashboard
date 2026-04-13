"use client";

/**
 * STOCK_TS 메인 차트: 가격 추이 + 이동평균선 오버레이
 * 시각화매핑규칙 §2-1 순서 1a 대응
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import type { CalculationResult, CrossoverEvent } from "@/types";
import { COLORS } from "@/types/visualization";

interface Props {
  calculation: CalculationResult;
}

export function PriceLineChart({ calculation }: Props) {
  // 가격(종가) 시계열 = 누적수익률 날짜 기반으로 역산 불가이므로, MA 시계열 사용
  const cumRetInd = calculation.indicators.find((i) => i.id === "cumulative_return");
  const maInds = calculation.indicators.filter((i) => i.id.startsWith("ma_"));

  if (!cumRetInd?.timeSeries) return null;

  const dates = cumRetInd.timeSeries.dates;

  // 차트 데이터 구성: 날짜 + 이동평균들
  const chartData = dates.map((date, idx) => {
    const row: Record<string, string | number> = {
      date: formatDate(date),
    };
    // MA 지표들 추가
    for (const ma of maInds) {
      if (ma.timeSeries) {
        const val = ma.timeSeries.values[idx];
        if (val !== 0) row[ma.name] = Number(val.toFixed(2));
      }
    }
    return row;
  });

  // MA 라인 색상
  const maColors = [COLORS.main[0], COLORS.main[1], COLORS.main[3]];

  // 골든/데드크로스 이벤트 마커
  const crossovers = calculation.crossoverEvents ?? [];

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        가격 추이 & 이동평균선
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#6B7280" }}
            interval="preserveStartEnd"
            tickCount={6}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6B7280" }}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            verticalAlign="top"
            height={28}
          />
          {maInds.map((ma, idx) => (
            <Line
              key={ma.id}
              type="monotone"
              dataKey={ma.name}
              stroke={maColors[idx % maColors.length]}
              strokeWidth={idx === 0 ? 2 : 1.5}
              dot={false}
              strokeDasharray={idx === 2 ? "5 3" : undefined}
            />
          ))}
          {/* 크로스오버 이벤트 마커 */}
          {crossovers.slice(-5).map((evt, idx) => {
            const dataIdx = dates.findIndex(
              (d) => d === evt.date || d.startsWith(evt.date)
            );
            if (dataIdx < 0) return null;
            const firstMa = maInds[0];
            const yVal = firstMa?.timeSeries?.values[dataIdx];
            if (!yVal) return null;
            return (
              <ReferenceDot
                key={`cross-${idx}`}
                x={formatDate(evt.date)}
                y={Number(yVal.toFixed(2))}
                r={6}
                fill={evt.type === "golden" ? COLORS.up : COLORS.down}
                stroke="#fff"
                strokeWidth={2}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
      {crossovers.length > 0 && (
        <div className="mt-2 flex gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: COLORS.up }}
            />
            골든크로스
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: COLORS.down }}
            />
            데드크로스
          </span>
        </div>
      )}
    </div>
  );
}

function formatDate(d: string): string {
  if (!d) return "";
  // YYYY-MM-DD → MM/DD
  const parts = d.split("-");
  if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
  return d.length > 10 ? d.slice(5, 10) : d;
}
