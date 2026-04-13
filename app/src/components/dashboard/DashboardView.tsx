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
  onReset: () => void;
}

export function DashboardView({ result, onReset }: DashboardViewProps) {
  const { detection, calculation, insights } = result;

  return (
    <div className="space-y-6">
      {/* 상단: 데이터 요약 + 리셋 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          <span className="font-medium text-gray-900">
            {detection.dataType}
          </span>
          {detection.subType && (
            <span className="ml-1 text-gray-400">({detection.subType})</span>
          )}
          {" · "}
          {detection.rowCount.toLocaleString()}행 × {detection.columnCount}열
          {detection.tickers && detection.tickers.length > 0 && (
            <span>
              {" · "}
              {detection.tickers.slice(0, 5).join(", ")}
              {detection.tickers.length > 5 &&
                ` 외 ${detection.tickers.length - 5}개`}
            </span>
          )}
        </div>
        <button
          onClick={onReset}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
        >
          새 파일 분석
        </button>
      </div>

      {/* 요약 배너 */}
      {insights.topBanner && <TopBannerBar banner={insights.topBanner} />}

      {/* KPI 카드 */}
      <KpiCardGrid cards={insights.kpiCards} />

      {/* 차트 그리드 */}
      <ChartGrid
        detection={detection}
        calculation={calculation}
        rawData={result.rawData}
      />

      {/* 인사이트 패널 */}
      <InsightPanel
        insights={insights.insights}
        displayMode={insights.config.displayMode}
      />
    </div>
  );
}
