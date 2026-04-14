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
  onReset?: () => void; // 탭 구조에서는 page.tsx가 관리
}

export function DashboardView({ result }: DashboardViewProps) {
  const { detection, calculation, insights } = result;

  return (
    <div className="space-y-6">
      {/* 상단: 데이터 요약 */}
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
