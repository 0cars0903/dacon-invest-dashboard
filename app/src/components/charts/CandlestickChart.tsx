"use client";

/**
 * STOCK_TS OHLC 캔들스틱 차트 (커스텀 SVG)
 * 시각화매핑규칙 §2-1 순서 1b 대응
 * OHLC 4개 컬럼 존재 시 PriceLineChart 대신 표시
 * 양봉(종가>시가): #10B981, 음봉(종가<시가): #EF4444
 */

import { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DetectionResult } from "@/types";
import { COLORS } from "@/types/visualization";

interface Props {
  detection: DetectionResult;
  rawData: Record<string, unknown>[];
}

interface CandleRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  bullish: boolean;
  // Recharts Bar용: [bottom, top]
  body: [number, number];
  wick: [number, number];
}

export function CandlestickChart({ detection, rawData }: Props) {
  const data = useMemo(() => {
    const dateCol = detection.columns.find((c) => c.role === "date");
    const ohlcCol = detection.columns.find((c) => c.role === "ohlc");
    const volCol = detection.columns.find((c) => c.role === "volume");

    if (!dateCol) return [];

    // OHLC 컬럼명 탐색 (대소문자 무시)
    const colNames = detection.columns.map((c) => c.name);
    const find = (keywords: string[]) =>
      colNames.find((n) =>
        keywords.some((k) => n.toLowerCase().includes(k))
      );

    const openName = find(["open"]);
    const highName = find(["high"]);
    const lowName = find(["low"]);
    const closeName = find(["close"]);

    if (!openName || !highName || !lowName || !closeName) return [];

    return rawData.slice(0, 120).map((row): CandleRow => {
      const o = Number(row[openName]) || 0;
      const h = Number(row[highName]) || 0;
      const l = Number(row[lowName]) || 0;
      const c = Number(row[closeName]) || 0;
      const bullish = c >= o;

      return {
        date: formatDate(String(row[dateCol.name] ?? "")),
        open: o,
        high: h,
        low: l,
        close: c,
        volume: volCol ? Number(row[volCol.name]) || 0 : undefined,
        bullish,
        body: bullish ? [o, c] : [c, o],
        wick: [l, h],
      };
    });
  }, [detection, rawData]);

  if (data.length === 0) return null;

  const hasVolume = data.some((d) => d.volume !== undefined && d.volume > 0);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        캔들스틱 차트 (OHLC)
      </h3>

      {/* 캔들스틱 본체 */}
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#6B7280" }}
            interval="preserveStartEnd"
            tickCount={8}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fontSize: 11, fill: "#6B7280" }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload as CandleRow;
              return (
                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
                  <p className="font-medium text-gray-700">{d.date}</p>
                  <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-gray-500">
                    <span>시가: {d.open.toLocaleString()}</span>
                    <span>고가: {d.high.toLocaleString()}</span>
                    <span>종가: {d.close.toLocaleString()}</span>
                    <span>저가: {d.low.toLocaleString()}</span>
                  </div>
                  {d.volume !== undefined && (
                    <p className="mt-1 text-gray-400">
                      거래량: {d.volume.toLocaleString()}
                    </p>
                  )}
                </div>
              );
            }}
          />

          {/* 심지 (wick): low ~ high */}
          <Bar dataKey="wick" barSize={1} isAnimationActive={false}>
            {data.map((d, i) => (
              <Cell
                key={`wick-${i}`}
                fill={d.bullish ? COLORS.up : COLORS.down}
              />
            ))}
          </Bar>

          {/* 몸통 (body): open ~ close */}
          <Bar dataKey="body" barSize={6} isAnimationActive={false}>
            {data.map((d, i) => (
              <Cell
                key={`body-${i}`}
                fill={d.bullish ? COLORS.up : COLORS.down}
              />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>

      {/* 거래량 바 차트 */}
      {hasVolume && (
        <ResponsiveContainer width="100%" height={80}>
          <ComposedChart data={data}>
            <XAxis dataKey="date" hide />
            <YAxis
              tick={{ fontSize: 9, fill: "#9CA3AF" }}
              tickFormatter={(v) =>
                v >= 1_000_000
                  ? `${(v / 1_000_000).toFixed(0)}M`
                  : v >= 1_000
                  ? `${(v / 1_000).toFixed(0)}K`
                  : String(v)
              }
            />
            <Bar dataKey="volume" isAnimationActive={false}>
              {data.map((d, i) => (
                <Cell
                  key={`vol-${i}`}
                  fill={d.bullish ? COLORS.up : COLORS.down}
                  fillOpacity={0.5}
                />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* 범례 */}
      <div className="mt-2 flex gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: COLORS.up }}
          />
          양봉 (상승)
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: COLORS.down }}
          />
          음봉 (하락)
        </span>
      </div>
    </div>
  );
}

function formatDate(d: string): string {
  if (!d) return "";
  const parts = d.split("-");
  if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
  return d.length > 10 ? d.slice(5, 10) : d;
}
