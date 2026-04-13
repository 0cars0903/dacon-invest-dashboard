"use client";

import type { Insight, DisplayMode, InsightLevel } from "@/types";

interface Props {
  insights: Insight[];
  displayMode: DisplayMode;
}

const levelStyles: Record<InsightLevel, string> = {
  alert: "border-l-red-500 bg-red-50",
  warning: "border-l-amber-500 bg-amber-50",
  info: "border-l-blue-500 bg-blue-50",
  positive: "border-l-emerald-500 bg-emerald-50",
};

export function InsightPanel({ insights, displayMode }: Props) {
  const sorted = [...insights].sort((a, b) => {
    const levelOrder: Record<InsightLevel, number> = {
      alert: 0, warning: 1, positive: 2, info: 3,
    };
    const diff = levelOrder[a.level] - levelOrder[b.level];
    return diff !== 0 ? diff : a.priority - b.priority;
  });

  const visible = sorted.slice(0, 10);

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-700">인사이트</h2>
      <div className="space-y-2">
        {visible.map((insight) => (
          <div
            key={insight.id}
            className={`rounded-lg border-l-4 px-4 py-3 ${levelStyles[insight.level]}`}
          >
            <p className="text-sm font-medium text-gray-800">
              {insight.icon}{" "}
              {displayMode === "simple" ? insight.titleSimple : insight.title}
            </p>
            <p className="mt-0.5 text-xs text-gray-600">
              {displayMode === "simple"
                ? insight.descriptionSimple
                : insight.description}
            </p>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="text-xs text-gray-400">생성된 인사이트가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
