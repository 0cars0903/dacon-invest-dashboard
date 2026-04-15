"use client";

import type { TopBanner } from "@/types";
import type { InsightLevel } from "@/types";

interface Props {
  banner: TopBanner;
}

/** 심각도별 Tailwind 배너 스타일 (DESIGN.md §2-3 — 인라인 style 금지) */
const bannerStyles: Record<InsightLevel, string> = {
  alert:    "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200 border border-red-200 dark:border-red-800",
  warning:  "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 border border-amber-200 dark:border-amber-800",
  positive: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800",
  info:     "bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200 border border-blue-200 dark:border-blue-800",
};

export function TopBannerBar({ banner }: Props) {
  const level = banner.insight.level as InsightLevel;

  return (
    <div
      className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium sm:px-5 ${bannerStyles[level]}`}
    >
      <span className="mt-0.5 shrink-0 text-base leading-none">
        {banner.insight.icon}
      </span>
      <span>{banner.summaryText}</span>
    </div>
  );
}
