"use client";

/**
 * ETF_COMP 상관계수 히트맵 (커스텀 셀 그리드)
 * 시각화매핑규칙 §2-2 순서 3 대응
 * 색상: 파랑(-1) ~ 회색(0) ~ 빨강(+1)
 */

import { useMemo } from "react";
import type { DetectionResult } from "@/types";
import { COLORS } from "@/types/visualization";

interface Props {
  detection: DetectionResult;
  rawData: Record<string, unknown>[];
}

interface CorrelationCell {
  row: string;
  col: string;
  value: number;
}

/** 피어슨 상관계수 계산 */
function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }

  const denom = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );
  if (Math.abs(denom) < 1e-10) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

/** 상관계수 → 색상 보간 */
function correlationColor(value: number): string {
  const clamped = Math.max(-1, Math.min(1, value));
  if (clamped < 0) {
    // 파랑 ~ 회색
    const t = 1 + clamped; // 0(-1) ~ 1(0)
    const r = Math.round(59 + (243 - 59) * t);
    const g = Math.round(130 + (244 - 130) * t);
    const b = Math.round(246 + (246 - 246) * t);
    return `rgb(${r},${g},${b})`;
  } else {
    // 회색 ~ 빨강
    const t = clamped; // 0(0) ~ 1(+1)
    const r = Math.round(243 + (239 - 243) * t);
    const g = Math.round(244 + (68 - 244) * t);
    const b = Math.round(246 + (68 - 246) * t);
    return `rgb(${r},${g},${b})`;
  }
}

export function CorrelationHeatmap({ detection, rawData }: Props) {
  const { tickers, matrix } = useMemo(() => {
    // ETF_COMP: Date 컬럼 + 종목별 가격 컬럼
    const dateCol = detection.columns.find((c) => c.role === "date");
    if (!dateCol) return { tickers: [], matrix: [] };

    const priceCols = detection.columns.filter(
      (c) => c.role === "price" || c.role === "numeric"
    );
    // 또는 tickers 기반으로 컬럼 매칭
    const tickerNames =
      priceCols.length > 0
        ? priceCols.map((c) => c.name)
        : detection.tickers ?? [];

    if (tickerNames.length < 2) return { tickers: [], matrix: [] };

    // 일간 수익률 계산
    const returns: Record<string, number[]> = {};
    for (const name of tickerNames) {
      const prices = rawData.map((r) => Number(r[name])).filter((v) => !isNaN(v) && v > 0);
      const rets: number[] = [];
      for (let i = 1; i < prices.length; i++) {
        rets.push((prices[i] - prices[i - 1]) / prices[i - 1]);
      }
      returns[name] = rets;
    }

    // 상관계수 행렬
    const cells: CorrelationCell[] = [];
    for (const row of tickerNames) {
      for (const col of tickerNames) {
        const value =
          row === col ? 1 : pearson(returns[row] ?? [], returns[col] ?? []);
        cells.push({ row, col, value: Number(value.toFixed(3)) });
      }
    }

    return { tickers: tickerNames, matrix: cells };
  }, [detection, rawData]);

  if (tickers.length < 2) return null;

  const cellSize = Math.min(64, Math.floor(400 / tickers.length));

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-slate-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
        상관계수 히트맵
      </h3>

      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* 헤더 행 */}
          <div className="flex">
            <div
              style={{ width: cellSize + 20, height: cellSize }}
              className="shrink-0"
            />
            {tickers.map((t) => (
              <div
                key={`header-${t}`}
                style={{ width: cellSize, height: cellSize }}
                className="flex items-center justify-center text-[10px] font-medium text-gray-600"
              >
                {t.length > 6 ? t.slice(0, 6) : t}
              </div>
            ))}
          </div>

          {/* 데이터 행 */}
          {tickers.map((rowTicker) => (
            <div key={`row-${rowTicker}`} className="flex">
              {/* 행 라벨 */}
              <div
                style={{ width: cellSize + 20, height: cellSize }}
                className="flex shrink-0 items-center pr-2 text-[10px] font-medium text-gray-600"
              >
                {rowTicker.length > 8 ? rowTicker.slice(0, 8) : rowTicker}
              </div>
              {/* 셀 */}
              {tickers.map((colTicker) => {
                const cell = matrix.find(
                  (c) => c.row === rowTicker && c.col === colTicker
                );
                const val = cell?.value ?? 0;
                return (
                  <div
                    key={`cell-${rowTicker}-${colTicker}`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: correlationColor(val),
                    }}
                    className="flex items-center justify-center rounded-sm border border-white/50 text-[10px] font-medium"
                    title={`${rowTicker} ↔ ${colTicker}: ${val.toFixed(3)}`}
                  >
                    <span
                      style={{
                        color: Math.abs(val) > 0.5 ? "#fff" : "#374151",
                      }}
                    >
                      {val.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 색상 범례 */}
      <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400">
        <span style={{ color: COLORS.heatmap.negative }}>-1 (역상관)</span>
        <div className="h-2 w-24 rounded-full bg-gradient-to-r from-blue-400 via-gray-200 to-red-400" />
        <span style={{ color: COLORS.heatmap.positive }}>+1 (정상관)</span>
      </div>
    </div>
  );
}
