"use client";

import type { KpiCard, InsightLevel } from "@/types";

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
  info:     "border-gray-100 dark:border-gray-700",
  positive: "border-emerald-300 dark:border-emerald-700",
};

/** 심각도 → 값 색상 (alert·warning 시 강조) */
const levelValueClass: Record<InsightLevel, string> = {
  alert:    "text-red-700 dark:text-red-400",
  warning:  "text-orange-600 dark:text-orange-400",
  info:     "text-gray-900 dark:text-white",
  positive: "text-emerald-700 dark:text-emerald-400",
};

export function KpiCardGrid({ cards }: Props) {
  // 최대 4개만 표시 (DESIGN.md §4-2)
  const visible = cards.slice(0, 4);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {visible.map((card, i) => (
        <div
          key={i}
          className={`rounded-xl border-2 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-800 sm:p-4 ${levelBorderClass[card.level]}`}
        >
          {/* 라벨: 작고 흐림 — DESIGN.md §3 */}
          <p className="truncate text-[11px] font-medium text-gray-500 dark:text-gray-400 sm:text-xs">
            {card.indicator}
          </p>

          {/* 핵심 수치: 가장 눈에 띄어야 함 — tabular-nums로 정렬 */}
          <p
            className={`mt-1 text-xl font-bold tabular-nums sm:text-2xl ${levelValueClass[card.level]}`}
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
