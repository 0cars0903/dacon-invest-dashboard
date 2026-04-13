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

import type { DetectionResult, CalculationResult } from "@/types";
import { PriceLineChart } from "../charts/PriceLineChart";
import { CumulativeReturnChart } from "../charts/CumulativeReturnChart";
import { VolumeBarChart } from "../charts/VolumeBarChart";
import { ReturnDistributionChart } from "../charts/ReturnDistributionChart";
import { RSIChart } from "../charts/RSIChart";
import { PortfolioPieChart } from "../charts/PortfolioPieChart";
import { SummaryTable } from "../charts/SummaryTable";
import { DataTable } from "../charts/DataTable";

interface Props {
  detection: DetectionResult;
  calculation: CalculationResult;
  rawData: Record<string, unknown>[];
}

export function ChartGrid({ detection, calculation, rawData }: Props) {
  const { dataType } = detection;

  // Fallback 모드: 테이블만
  if (calculation.fallbackMode) {
    return (
      <div className="space-y-4">
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
          <CumulativeReturnChart calculation={calculation} />
          <SummaryTable calculation={calculation} detection={detection} />
          <DataTable rawData={rawData} />
        </div>
      );
    }

    if (subType === "CUSTOM_CAT" || subType === "CUSTOM_NUM") {
      return (
        <div className="space-y-4">
          <SummaryTable calculation={calculation} detection={detection} />
          <DataTable rawData={rawData} />
        </div>
      );
    }

    // CUSTOM_RAW 또는 기타
    return (
      <div className="space-y-4">
        <DataTable rawData={rawData} maxRows={100} />
      </div>
    );
  }

  // 기본 fallback
  return (
    <div className="space-y-4">
      <DataTable rawData={rawData} />
    </div>
  );
}
