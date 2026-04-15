"use client";

import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Insight, DisplayMode, InsightLevel } from "@/types";

interface Props {
  insights: Insight[];
  displayMode: DisplayMode;
}

/** 심각도별 좌측 컬러바 + 배경 (DESIGN.md §4-5) */
const levelStyles: Record<InsightLevel, string> = {
  alert:    "border-l-red-500 bg-red-50 dark:bg-red-950/30",
  warning:  "border-l-amber-500 bg-amber-50 dark:bg-amber-950/30",
  info:     "border-l-blue-500 bg-blue-50 dark:bg-blue-950/30",
  positive: "border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
};

/** 심각도별 Lucide 아이콘 + 색상 */
const LevelIcon = ({ level }: { level: InsightLevel }) => {
  const cls = "h-4 w-4 shrink-0 mt-0.5";
  switch (level) {
    case "alert":    return <AlertCircle   className={`${cls} text-red-500`} />;
    case "warning":  return <AlertTriangle className={`${cls} text-amber-500`} />;
    case "positive": return <CheckCircle2  className={`${cls} text-emerald-500`} />;
    case "info":     return <Info          className={`${cls} text-blue-500`} />;
  }
};

/** 심각도 우선순위 */
const levelOrder: Record<InsightLevel, number> = {
  alert: 0, warning: 1, positive: 2, info: 3,
};

/** 심각도 한글 라벨 */
const levelLabel: Record<InsightLevel, string> = {
  alert:    "주의",
  warning:  "경고",
  positive: "긍정",
  info:     "정보",
};

const INITIAL_VISIBLE = 5;

export function InsightPanel({ insights, displayMode: initialDisplayMode }: Props) {
  const [mode, setMode] = useState<DisplayMode>(initialDisplayMode);
  const [showAll, setShowAll] = useState(false);

  const sorted = [...insights].sort((a, b) => {
    const diff = levelOrder[a.level] - levelOrder[b.level];
    return diff !== 0 ? diff : a.priority - b.priority;
  });

  const visible = showAll ? sorted : sorted.slice(0, INITIAL_VISIBLE);
  const hasMore = sorted.length > INITIAL_VISIBLE;

  return (
    <div className="space-y-3">
      {/* 헤더: 제목 + expert/simple 토글 */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          인사이트
          <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
            ({sorted.length}개)
          </span>
        </h2>
        <button
          onClick={() => setMode(m => m === "simple" ? "expert" : "simple")}
          className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors
            bg-gray-100 text-gray-600 hover:bg-gray-200
            dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
        >
          {mode === "simple" ? "전문가 모드" : "초보자 모드"}
        </button>
      </div>

      {/* 인사이트 리스트 */}
      <div className="space-y-2">
        {visible.map((insight) => (
          <div
            key={insight.id}
            className={`flex items-start gap-3 rounded-lg border-l-4 px-3 py-2.5 sm:px-4 sm:py-3 ${levelStyles[insight.level]}`}
          >
            {/* Lucide 아이콘 */}
            <LevelIcon level={insight.level} />

            {/* 내용 */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {/* 심각도 뱃지 */}
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  {levelLabel[insight.level]}
                </span>
                {/* 제목 */}
                <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                  {mode === "simple" ? insight.titleSimple : insight.title}
                </p>
              </div>
              {/* 설명 */}
              <p className="mt-0.5 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                {mode === "simple"
                  ? insight.descriptionSimple
                  : insight.description}
              </p>
            </div>
          </div>
        ))}

        {/* 인사이트 없음 */}
        {visible.length === 0 && (
          <p className="rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-400 dark:bg-slate-800 dark:text-gray-500">
            생성된 인사이트가 없습니다.
          </p>
        )}
      </div>

      {/* 더 보기 / 접기 */}
      {hasMore && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-gray-400 dark:hover:bg-slate-800"
        >
          {showAll ? (
            <>접기 <ChevronUp className="h-3.5 w-3.5" /></>
          ) : (
            <>나머지 {sorted.length - INITIAL_VISIBLE}개 더 보기 <ChevronDown className="h-3.5 w-3.5" /></>
          )}
        </button>
      )}

      {/* 출처 */}
      <p className="text-right text-[10px] text-gray-300 dark:text-gray-600">
        InvestLens 자동 생성
      </p>
    </div>
  );
}
