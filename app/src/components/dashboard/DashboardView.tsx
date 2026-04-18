"use client";

import type { DetectionResult, CalculationResult, InsightResult } from "@/types";
import { KpiCardGrid } from "./KpiCardGrid";
import { TopBannerBar } from "./TopBannerBar";
import { InsightPanel } from "./InsightPanel";
import { ChartGrid } from "./ChartGrid";

interface AnalysisResult {
  detection: DetectionResult;
  calculation: CalculationResult;
  insights: InsightResult;
  rawData: Record<string, unknown>[];
}

interface DashboardViewProps {
  result: AnalysisResult;
  onReset?: () => void;
}

export function DashboardView({ result }: DashboardViewProps) {
  const { detection, calculation, insights } = result;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 상단: 데이터 요약 뱃지 */}
      <div className="animate-fade-in flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          {detection.dataType}
          {detection.subType && (
            <span className="text-indigo-400 dark:text-indigo-500">
              · {detection.subType}
            </span>
          )}
        </span>
        <span className="text-gray-400 dark:text-gray-500">
          {detection.rowCount.toLocaleString()}행 × {detection.columnCount}열
        </span>
        {detection.tickers && detection.tickers.length > 0 && (
          <span className="text-gray-400 dark:text-gray-500">
            · {detection.tickers.slice(0, 5).join(", ")}
            {detection.tickers.length > 5 &&
              ` 외 ${detection.tickers.length - 5}개`}
          </span>
        )}
      </div>

      {/* 요약 배너 */}
      {insights.topBanner && (
        <div className="animate-fade-in-up delay-100">
          <TopBannerBar banner={insights.topBanner} />
        </div>
      )}

      {/* KPI 카드 */}
      <div className="animate-fade-in delay-200">
        <KpiCardGrid cards={insights.kpiCards} />
      </div>

      {/* 차트 그리드 */}
      <div className="animate-fade-in-up delay-300">
        <ChartGrid
          detection={detection}
          calculation={calculation}
          rawData={result.rawData}
        />
      </div>

      {/* 인사이트 패널 */}
      <div className="animate-fade-in-up delay-400">
        <InsightPanel
          insights={insights.insights}
          displayMode={insights.config.displayMode}
        />
      </div>
    </div>
  );
}
