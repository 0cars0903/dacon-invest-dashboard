"use client";

import type { KpiCard, InsightLevel } from "@/types";
import {
  TrendingUp,
  Activity,
  ShieldAlert,
  BarChart3,
} from "lucide-react";

interface Props {
  cards: KpiCard[];
}

/** 변화 방향 → Tailwind 텍스트 색상 (한국 증시 관례: 상승=빨강, 하락=파랑) */
const dirTextClass: Record<string, string> = {
  up:      "text-red-500",
  down:    "text-blue-500",
  neutral: "text-gray-400 dark:text-gray-500",
};

/** 심각도 → border 색상 (DESIGN.md §2-3) */
const levelBorderClass: Record<InsightLevel, string> = {
  alert:    "border-red-300 dark:border-red-700",
  warning:  "border-orange-300 dark:border-orange-600",
  info:     "border-gray-200 dark:border-slate-700",
  positive: "border-emerald-300 dark:border-emerald-700",
};

/** 심각도 → 값 색상 (alert·warning 시 강조) */
const levelValueClass: Record<InsightLevel, string> = {
  alert:    "text-red-700 dark:text-red-400",
  warning:  "text-orange-600 dark:text-orange-400",
  info:     "text-gray-900 dark:text-white",
  positive: "text-emerald-700 dark:text-emerald-400",
};

/** 심각도 → 배경 그라디언트 (미묘한 액센트) */
const levelBgClass: Record<InsightLevel, string> = {
  alert:    "bg-gradient-to-br from-white to-red-50/50 dark:from-slate-800 dark:to-red-950/20",
  warning:  "bg-gradient-to-br from-white to-amber-50/50 dark:from-slate-800 dark:to-amber-950/20",
  info:     "bg-white dark:bg-slate-800",
  positive: "bg-gradient-to-br from-white to-emerald-50/40 dark:from-slate-800 dark:to-emerald-950/20",
};

/** KPI 인덱스에 따른 아이콘 배정 (4개 고정) */
const kpiIcons = [
  <TrendingUp key="0" className="h-3.5 w-3.5" />,
  <Activity key="1" className="h-3.5 w-3.5" />,
  <ShieldAlert key="2" className="h-3.5 w-3.5" />,
  <BarChart3 key="3" className="h-3.5 w-3.5" />,
];

/** 심각도별 아이콘 색상 */
const levelIconClass: Record<InsightLevel, string> = {
  alert:    "text-red-400 dark:text-red-500",
  warning:  "text-orange-400 dark:text-orange-500",
  info:     "text-gray-400 dark:text-gray-500",
  positive: "text-emerald-400 dark:text-emerald-500",
};

export function KpiCardGrid({ cards }: Props) {
  // 최대 4개만 표시 (DESIGN.md §4-2)
  const visible = cards.slice(0, 4);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {visible.map((card, i) => (
        <div
          key={i}
          className={`animate-fade-in-up relative overflow-hidden rounded-xl border-2 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-4 ${levelBorderClass[card.level]} ${levelBgClass[card.level]}`}
          /* 동적 animation-delay는 Tailwind로 불가 — inline style 필수 예외 */
          style={{ animationDelay: `${i * 80}ms` }}
        >
          {/* 상단 액센트 라인 */}
          <div className={`absolute inset-x-0 top-0 h-0.5 ${
            card.level === "alert" ? "bg-gradient-to-r from-red-400 to-red-500" :
            card.level === "warning" ? "bg-gradient-to-r from-orange-400 to-amber-500" :
            card.level === "positive" ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
            "bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-600 dark:to-slate-700"
          }`} />

          {/* 라벨 + 아이콘 — DESIGN.md §3 */}
          <div className="flex items-center gap-1.5">
            <span className={levelIconClass[card.level]}>
              {kpiIcons[i] ?? kpiIcons[0]}
            </span>
            <p className="truncate text-[11px] font-medium text-gray-500 dark:text-gray-400 sm:text-xs">
              {card.indicator}
            </p>
          </div>

          {/* 핵심 수치: 가장 눈에 띄어야 함 — tabular-nums로 정렬 */}
          <p
            className={`mt-1.5 text-xl font-bold tabular-nums sm:text-2xl ${levelValueClass[card.level]}`}
          >
            {card.value}
          </p>

          {/* 변화량: 상승=빨강, 하락=파랑 (한국 관례) */}
          {card.change && (
            <p
              className={`mt-0.5 text-[11px] font-semibold sm:text-xs ${dirTextClass[card.changeDirection]}`}
            >
              {card.change}
            </p>
          )}

          {/* 인사이트 한 줄 요약 */}
          <p className="mt-1 truncate text-[10px] text-gray-400 dark:text-gray-500 sm:text-xs">
            {card.subtitle}
          </p>
        </div>
      ))}
    </div>
  );
}
