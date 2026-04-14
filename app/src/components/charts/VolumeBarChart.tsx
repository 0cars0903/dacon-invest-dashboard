"use client";

/**
 * 거래량 바 차트
 * 시각화매핑규칙 §2-1 순서 3 대응
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DetectionResult } from "@/types";
import { COLORS } from "@/types/visualization";

interface Props {
  detection: DetectionResult;
  rawData: Record<string, unknown>[];
}

export function VolumeBarChart({ detection, rawData }: Props) {
  const volCol = detection.columns.find((c) => c.role === "volume");
  const dateCol = detection.columns.find((c) => c.role === "date");
  if (!volCol || !dateCol) return null;

  // 최근 60일만 표시 (가독성)
  const recent = rawData.slice(-60);
  const data = recent.map((row) => ({
    date: formatDate(String(row[dateCol.name] ?? "")),
    volume: Number(row[volCol.name]) || 0,
  }));

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-slate-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">거래량</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#6B7280" }}
            interval="preserveStartEnd"
            tickCount={5}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#6B7280" }}
            tickFormatter={formatVolume}
          />
          <Tooltip
            formatter={(val) => [Number(val).toLocaleString(), "거래량"]}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="volume" fill={COLORS.main[0]} fillOpacity={0.6} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatDate(d: string): string {
  const parts = d.split("-");
  if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
  return d.length > 10 ? d.slice(5, 10) : d;
}

function formatVolume(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return String(val);
}
