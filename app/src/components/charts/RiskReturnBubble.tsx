"use client";

/**
 * 위험-수익 버블 차트
 * 시각화매핑규칙 §2-2 순서 4, §2-3 순서 4 대응
 * X=변동성, Y=수익률, 크기=비중/거래량
 * ETF_COMP, PORT_ALLOC 모두 지원
 */

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  ReferenceLine,
} from "recharts";
import type { DetectionResult, CalculationResult } from "@/types";
import { COLORS } from "@/types/visualization";

interface Props {
  detection: DetectionResult;
  calculation: CalculationResult;
  rawData: Record<string, unknown>[];
}

interface BubblePoint {
  name: string;
  x: number; // 변동성 (%)
  y: number; // 수익률 (%)
  z: number; // 크기 (비중 or 데이터 포인트 수)
  fill: string;
}

export function RiskReturnBubble({ detection, calculation, rawData }: Props) {
  const { dataType } = detection;
  const points: BubblePoint[] = [];
  const mainColors = [...COLORS.main, "#8B5CF6", "#EC4899", "#14B8A6"];

  if (dataType === "ETF_COMP") {
    // ETF_COMP: 종목별 수익률·변동성을 indicators에서 추출
    const tickers = detection.tickers ?? [];
    const dateCol = detection.columns.find((c) => c.role === "date");
    if (!dateCol) return null;

    const priceCols = detection.columns.filter(
      (c) => c.role === "price" || c.role === "numeric"
    );
    const colNames =
      priceCols.length > 0 ? priceCols.map((c) => c.name) : tickers;

    for (let i = 0; i < colNames.length; i++) {
      const name = colNames[i];
      const prices = rawData
        .map((r) => Number(r[name]))
        .filter((v) => !isNaN(v) && v > 0);

      if (prices.length < 5) continue;

      // 일간 수익률
      const rets: number[] = [];
      for (let j = 1; j < prices.length; j++) {
        rets.push((prices[j] - prices[j - 1]) / prices[j - 1]);
      }

      const totalReturn =
        ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;
      const mean = rets.reduce((s, r) => s + r, 0) / rets.length;
      const variance =
        rets.reduce((s, r) => s + (r - mean) ** 2, 0) / rets.length;
      const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100;

      points.push({
        name,
        x: Number(volatility.toFixed(2)),
        y: Number(totalReturn.toFixed(2)),
        z: prices.length,
        fill: mainColors[i % mainColors.length],
      });
    }
  } else if (dataType === "PORT_ALLOC") {
    // PORT_ALLOC: rawData에서 직접 추출
    const weightCol = detection.columns.find((c) => c.role === "weight");
    const nameCol =
      detection.columns.find((c) => c.role === "ticker") ??
      detection.columns.find((c) => c.role === "category") ??
      detection.columns[0];

    // 수익률/변동성 컬럼 탐색
    const returnCol = detection.columns.find(
      (c) =>
        c.name.toLowerCase().includes("return") ||
        c.name.toLowerCase().includes("수익")
    );

    if (!nameCol) return null;

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const name = String(row[nameCol.name] ?? `자산${i + 1}`);
      const weight = weightCol ? Number(row[weightCol.name]) || 10 : 10;
      const ret = returnCol ? Number(row[returnCol.name]) || 0 : 0;

      points.push({
        name,
        x: weight, // 포트폴리오에서는 비중을 X축으로
        y: ret,
        z: weight,
        fill: mainColors[i % mainColors.length],
      });
    }
  }

  if (points.length < 2) return null;

  const isETF = dataType === "ETF_COMP";
  const xLabel = isETF ? "변동성 (%)" : "비중 (%)";
  const yLabel = "수익률 (%)";

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-slate-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
        {isETF ? "위험-수익 버블" : "자산별 비중-수익률"}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="x"
            type="number"
            name={xLabel}
            tick={{ fontSize: 11, fill: "#6B7280" }}
            label={{
              value: xLabel,
              position: "insideBottom",
              offset: -5,
              style: { fontSize: 10, fill: "#9CA3AF" },
            }}
          />
          <YAxis
            dataKey="y"
            type="number"
            name={yLabel}
            tick={{ fontSize: 11, fill: "#6B7280" }}
            label={{
              value: yLabel,
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 10, fill: "#9CA3AF" },
            }}
          />
          <ZAxis dataKey="z" range={[60, 600]} />
          <ReferenceLine y={0} stroke="#D1D5DB" strokeDasharray="3 3" />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload as BubblePoint;
              return (
                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
                  <p className="font-medium text-gray-700">{d.name}</p>
                  <p className="text-gray-500">
                    {xLabel}: {d.x}%
                  </p>
                  <p className="text-gray-500">
                    {yLabel}: {d.y}%
                  </p>
                </div>
              );
            }}
          />
          <Scatter data={points} isAnimationActive={false}>
            {/* 개별 점 색상은 data의 fill 속성에서 */}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* 범례 */}
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-gray-500">
        {points.map((p) => (
          <span key={p.name} className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: p.fill }}
            />
            {p.name}
          </span>
        ))}
      </div>
    </div>
  );
}
