"use client";

/**
 * 요약 통계 테이블
 * 시각화매핑규칙: 각 유형별 요약 테이블 대응
 */

import type { CalculationResult, DetectionResult } from "@/types";

interface Props {
  calculation: CalculationResult;
  detection: DetectionResult;
}

export function SummaryTable({ calculation, detection }: Props) {
  const { summary, indicators } = calculation;

  // 표시할 지표 선별
  const displayIndicators = indicators
    .filter((ind) => {
      // 시계열 데이터는 테이블에 부적합, 단일 값만
      if (Array.isArray(ind.value)) return false;
      if (ind.timeSeries && typeof ind.value !== "number") return false;
      return typeof ind.value === "number";
    })
    .slice(0, 10);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-slate-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">요약 통계</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-600">
              <th className="pb-2 pr-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                지표
              </th>
              <th className="pb-2 pr-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                값
              </th>
              <th className="pb-2 text-xs font-medium text-gray-500 dark:text-gray-400">구분</th>
            </tr>
          </thead>
          <tbody>
            {displayIndicators.map((ind) => (
              <tr key={ind.id} className="border-b border-gray-50 dark:border-gray-700">
                <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{ind.name}</td>
                <td className="py-2 pr-4 text-right font-mono text-gray-900 dark:text-white">
                  {formatValue(ind.value as number, ind.unit)}
                </td>
                <td className="py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      ind.category === "required"
                        ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300"
                        : "bg-gray-50 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {ind.category === "required" ? "필수" : "선택"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* 데이터 메타 정보 */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-400">
        <span>유형: {detection.dataType}</span>
        {detection.dateRange && (
          <span>
            기간: {detection.dateRange.start} ~ {detection.dateRange.end}
          </span>
        )}
        <span>빈도: {detection.dateRange?.frequency ?? "N/A"}</span>
        <span>신뢰도: {(detection.confidence * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}

function formatValue(val: number, unit: string): string {
  if (unit === "%") return `${(val * 100).toFixed(2)}%`;
  if (unit === "ratio") return val.toFixed(4);
  if (unit === "index") return val.toFixed(1);
  return val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
