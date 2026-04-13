"use client";

/**
 * 포트폴리오 자산 배분 도넛 차트
 * 시각화매핑규칙 §2-3 순서 1 대응
 */

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { DetectionResult } from "@/types";
import { COLORS } from "@/types/visualization";

interface Props {
  detection: DetectionResult;
  rawData: Record<string, unknown>[];
}

export function PortfolioPieChart({ detection, rawData }: Props) {
  const tickerCol = detection.columns.find((c) => c.role === "ticker");
  const weightCol = detection.columns.find((c) => c.role === "weight");
  const catCol = detection.columns.find((c) => c.role === "category");
  const nameCol = tickerCol ?? catCol;

  if (!nameCol || !weightCol) return null;

  const data = rawData.map((row) => ({
    name: String(row[nameCol.name] ?? "기타"),
    value: Math.abs(Number(row[weightCol.name]) || 0),
  }));

  // 비중 합산 → %로 정규화
  const total = data.reduce((s, d) => s + d.value, 0);
  const normalized = data.map((d) => ({
    ...d,
    value: total > 0 ? Number(((d.value / total) * 100).toFixed(1)) : 0,
  }));

  const mainColors = [...COLORS.main, "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">자산 배분</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={normalized}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            label={(props) =>
              `${String(props.name ?? "")} ${Number(props.value ?? 0)}%`
            }
            labelLine={{ stroke: "#9CA3AF", strokeWidth: 1 }}
          >
            {normalized.map((_, idx) => (
              <Cell
                key={idx}
                fill={mainColors[idx % mainColors.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(val) => [`${Number(val)}%`, "비중"]}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
