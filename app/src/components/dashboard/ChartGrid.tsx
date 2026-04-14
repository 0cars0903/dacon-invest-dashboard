"use client";

/**
 * ChartGrid — 데이터 유형별 차트 자동 배정 및 렌더링
 * 시각화매핑규칙 v2.1 §2 기반
 *
 * 데이터 유형 → 차트 조합:
 *   STOCK_TS  → 가격+MA, 누적수익률, 거래량, 수익률분포, RSI, 요약테이블
 *   ETF_COMP  → 누적수익률, 요약테이블 (+ 향후 정규화비교 등)
 *   PORT_ALLOC → 파이차트, 요약테이블
 *   CUSTOM    → 데이터테이블 + 가능 시 시계열
 *   Fallback  → 데이터테이블만
 */

import { useState, useMemo } from "react";
import type { DetectionResult, CalculationResult } from "@/types";
import { PriceLineChart } from "../charts/PriceLineChart";
import { CumulativeReturnChart } from "../charts/CumulativeReturnChart";
import { VolumeBarChart } from "../charts/VolumeBarChart";
import { ReturnDistributionChart } from "../charts/ReturnDistributionChart";
import { RSIChart } from "../charts/RSIChart";
import { PortfolioPieChart } from "../charts/PortfolioPieChart";
import { SummaryTable } from "../charts/SummaryTable";
import { DataTable } from "../charts/DataTable";
import { generateChartReasons } from "@/lib/chartReasons";

interface Props {
  detection: DetectionResult;
  calculation: CalculationResult;
  rawData: Record<string, unknown>[];
}

/** 차트 선택 이유 배너 */
function ChartReasonsBanner({
  detection,
  calculation,
}: {
  detection: DetectionResult;
  calculation: CalculationResult;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const summary = useMemo(
    () => generateChartReasons(detection, calculation),
    [detection, calculation]
  );

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs">
            🔍
          </span>
          <span className="text-sm font-medium text-indigo-900">
            {summary.dataTypeLabel} 감지 → {summary.totalCharts}개 차트 자동 배정
          </span>
        </div>
        <svg
          className={`h-4 w-4 text-indigo-400 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 한 줄 요약 — 항상 표시 */}
      <p className="mt-1 text-xs text-indigo-700">{summary.overallReason}</p>

      {/* 펼침 시 개별 이유 */}
      {isExpanded && (
        <div className="mt-3 space-y-2 border-t border-indigo-100 pt-3">
          {summary.reasons.map((r, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-indigo-100 text-[10px] font-bold text-indigo-600">
                {i + 1}
              </span>
              <div>
                <span className="font-medium text-gray-800">{r.chartName}</span>
                <span className="text-gray-500"> — {r.reason}</span>
                <p className="mt-0.5 text-[10px] text-indigo-400">{r.basis}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChartGrid({ detection, calculation, rawData }: Props) {
  const { dataType } = detection;

  // Fallback 모드: 테이블만
  if (calculation.fallbackMode) {
    return (
      <div className="space-y-4">
        <ChartReasonsBanner detection={detection} calculation={calculation} />
        <DataTable rawData={rawData} maxRows={100} />
      </div>
    );
  }

  // STOCK_TS: 가격 시계열 중심
  if (dataType === "STOCK_TS") {
    const hasVolume = detection.columns.some((c) => c.role === "volume");
    const hasRsi = calculation.indicators.some((i) => i.id === "rsi");
    const indicatorCount = calculation.indicators.length;

    return (
      <div className="space-y-4">
        <ChartReasonsBanner detection={detection} calculation={calculation} />
        {/* FULL: 가격 + MA */}
        <PriceLineChart calculation={calculation} />

        {/* FULL: 누적 수익률 */}
        <CumulativeReturnChart calculation={calculation} />

        {/* HALF × 2: 거래량 + 수익률 분포 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {hasVolume && (
            <VolumeBarChart detection={detection} rawData={rawData} />
          )}
          <ReturnDistributionChart calculation={calculation} />
        </div>

        {/* HALF × 2: RSI + 요약 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {hasRsi && <RSIChart calculation={calculation} />}
          <SummaryTable calculation={calculation} detection={detection} />
        </div>

        {/* 지표 부족 시 원본 데이터 보완 */}
        {indicatorCount < 3 && <DataTable rawData={rawData} />}
      </div>
    );
  }

  // ETF_COMP: 비교 중심
  if (dataType === "ETF_COMP") {
    return (
      <div className="space-y-4">
        <ChartReasonsBanner detection={detection} calculation={calculation} />
        <CumulativeReturnChart calculation={calculation} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SummaryTable calculation={calculation} detection={detection} />
          <ReturnDistributionChart calculation={calculation} />
        </div>
        <DataTable rawData={rawData} maxRows={30} />
      </div>
    );
  }

  // PORT_ALLOC: 배분 중심
  if (dataType === "PORT_ALLOC") {
    return (
      <div className="space-y-4">
        <ChartReasonsBanner detection={detection} calculation={calculation} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PortfolioPieChart detection={detection} rawData={rawData} />
          <SummaryTable calculation={calculation} detection={detection} />
        </div>
        <DataTable rawData={rawData} />
      </div>
    );
  }

  // CUSTOM: 서브타입에 따라 분기
  if (dataType === "CUSTOM") {
    const { subType } = detection;

    if (subType === "CUSTOM_TS") {
      return (
        <div className="space-y-4">
          <ChartReasonsBanner detection={detection} calculation={calculation} />
          <CumulativeReturnChart calculation={calculation} />
          <SummaryTable calculation={calculation} detection={detection} />
          <DataTable rawData={rawData} />
        </div>
      );
    }

    if (subType === "CUSTOM_CAT" || subType === "CUSTOM_NUM") {
      return (
        <div className="space-y-4">
          <ChartReasonsBanner detection={detection} calculation={calculation} />
          <SummaryTable calculation={calculation} detection={detection} />
          <DataTable rawData={rawData} />
        </div>
      );
    }

    // CUSTOM_RAW 또는 기타
    return (
      <div className="space-y-4">
        <ChartReasonsBanner detection={detection} calculation={calculation} />
        <DataTable rawData={rawData} maxRows={100} />
      </div>
    );
  }

  // 기본 fallback
  return (
    <div className="space-y-4">
      <ChartReasonsBanner detection={detection} calculation={calculation} />
      <DataTable rawData={rawData} />
    </div>
  );
}
