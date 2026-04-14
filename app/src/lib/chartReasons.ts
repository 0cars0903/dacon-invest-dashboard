/**
 * 차트 선택 이유 자동 생성 — 자동생성 체감도 강화
 * 데이터 유형 + 감지 결과 기반으로, "왜 이 차트 조합을 선택했는지" 설명 문구 반환
 * Skills.md 시각화매핑규칙 §2 기반
 */

import type { DetectionResult, CalculationResult } from "@/types";

export interface ChartReason {
  chartName: string;
  reason: string;
  basis: string; // Skills.md 규칙 참조
}

export interface ChartSelectionSummary {
  dataTypeLabel: string;
  totalCharts: number;
  reasons: ChartReason[];
  overallReason: string;
}

export function generateChartReasons(
  detection: DetectionResult,
  calculation: CalculationResult
): ChartSelectionSummary {
  const { dataType, subType, columns } = detection;
  const reasons: ChartReason[] = [];

  const hasVolume = columns.some((c) => c.role === "volume");
  const hasRsi = calculation.indicators.some((i) => i.id === "rsi");
  const hasOhlc = columns.some((c) => c.role === "ohlc");

  if (calculation.fallbackMode) {
    return {
      dataTypeLabel: "분석 불가",
      totalCharts: 1,
      reasons: [
        {
          chartName: "데이터 테이블",
          reason: "투자 지표를 계산할 수 있는 수치 컬럼이 부족하여, 원본 데이터를 테이블로 표시합니다.",
          basis: "Fallback 체인 규칙 (H3)",
        },
      ],
      overallReason:
        "업로드된 데이터에서 투자 분석에 필요한 수치 컬럼을 감지하지 못해 원본 데이터를 보여드립니다.",
    };
  }

  if (dataType === "STOCK_TS") {
    const maCount = calculation.indicators.filter((i) => i.id.startsWith("ma_")).length;
    reasons.push({
      chartName: "가격 추이 + 이동평균선",
      reason: `날짜·종가 컬럼이 감지되어, 가격 흐름과 ${maCount}개 이동평균선을 함께 표시합니다.`,
      basis: "시각화매핑규칙 §2.1 STOCK_TS → LINE(가격+MA)",
    });
    reasons.push({
      chartName: "누적 수익률",
      reason: "시작점 대비 누적 수익률 추이를 시각화하여, 투자 성과를 한눈에 보여줍니다.",
      basis: "시각화매핑규칙 §2.1 STOCK_TS → AREA(누적수익률)",
    });
    if (hasVolume) {
      reasons.push({
        chartName: "거래량",
        reason: "거래량(volume) 컬럼이 감지되어, 가격 변동과 거래량 관계를 확인할 수 있습니다.",
        basis: "시각화매핑규칙 §2.1 조건부: volume 존재 시",
      });
    }
    reasons.push({
      chartName: "수익률 분포",
      reason: "일일 수익률의 분포를 히스토그램으로 표시하여, 변동성 패턴을 보여줍니다.",
      basis: "시각화매핑규칙 §2.1 STOCK_TS → BAR(수익률분포)",
    });
    if (hasRsi) {
      reasons.push({
        chartName: "RSI (14)",
        reason: "14일 RSI 지표를 계산하여, 과매수/과매도 구간을 시각화합니다.",
        basis: "시각화매핑규칙 §2.1 STOCK_TS → LINE(RSI)",
      });
    }
    reasons.push({
      chartName: "요약 테이블",
      reason: "총수익률·샤프비율·MDD 등 핵심 지표를 한눈에 비교할 수 있는 요약 테이블입니다.",
      basis: "시각화매핑규칙 §2.1 공통: TABLE(요약)",
    });

    return {
      dataTypeLabel: "주식 시계열 (STOCK_TS)",
      totalCharts: reasons.length,
      reasons,
      overallReason: `날짜·종가${hasVolume ? "·거래량" : ""}${hasOhlc ? "·OHLC" : ""} 컬럼이 감지되어, 주식 시계열 분석에 최적화된 ${reasons.length}개 차트를 자동 배정했습니다.`,
    };
  }

  if (dataType === "ETF_COMP") {
    reasons.push({
      chartName: "누적 수익률 비교",
      reason: `${detection.tickers?.length ?? 0}개 ETF/종목의 수익률을 Base-100 기준으로 정규화하여 비교합니다.`,
      basis: "시각화매핑규칙 §2.2 ETF_COMP → AREA(정규화비교)",
    });
    reasons.push({
      chartName: "요약 테이블",
      reason: "종목별 수익률·변동성·샤프비율을 비교 테이블로 정리합니다.",
      basis: "시각화매핑규칙 §2.2 ETF_COMP → TABLE(종목별비교)",
    });
    reasons.push({
      chartName: "수익률 분포",
      reason: "각 종목의 수익률 분포를 비교하여, 리스크 특성 차이를 시각화합니다.",
      basis: "시각화매핑규칙 §2.2 ETF_COMP → BAR(분포비교)",
    });
    reasons.push({
      chartName: "데이터 테이블",
      reason: "원본 비교 데이터를 테이블로 제공하여, 세부 수치 확인이 가능합니다.",
      basis: "시각화매핑규칙 §2.2 공통: TABLE(원본)",
    });

    return {
      dataTypeLabel: "ETF/종목 비교 (ETF_COMP)",
      totalCharts: reasons.length,
      reasons,
      overallReason: `${detection.tickers?.length ?? "복수"}개 종목의 비교 데이터가 감지되어, ETF 비교 분석에 최적화된 ${reasons.length}개 차트를 자동 배정했습니다.`,
    };
  }

  if (dataType === "PORT_ALLOC") {
    reasons.push({
      chartName: "포트폴리오 비중 파이차트",
      reason: "자산명·비중(weight) 컬럼이 감지되어, 포트폴리오 구성을 한눈에 보여줍니다.",
      basis: "시각화매핑규칙 §2.3 PORT_ALLOC → PIE(비중)",
    });
    reasons.push({
      chartName: "요약 테이블",
      reason: "HHI 집중도·최대 비중 자산 등 핵심 배분 지표를 요약합니다.",
      basis: "시각화매핑규칙 §2.3 PORT_ALLOC → TABLE(요약)",
    });
    reasons.push({
      chartName: "데이터 테이블",
      reason: "원본 포트폴리오 데이터를 테이블로 제공합니다.",
      basis: "시각화매핑규칙 §2.3 공통: TABLE(원본)",
    });

    return {
      dataTypeLabel: "포트폴리오 배분 (PORT_ALLOC)",
      totalCharts: reasons.length,
      reasons,
      overallReason: `자산명·비중 컬럼이 감지되어, 포트폴리오 배분 분석에 최적화된 ${reasons.length}개 차트를 자동 배정했습니다.`,
    };
  }

  // CUSTOM 유형
  if (dataType === "CUSTOM") {
    if (subType === "CUSTOM_TS") {
      reasons.push({
        chartName: "시계열 추이",
        reason: "날짜·수치 컬럼이 감지되었으나 표준 투자 구조가 아니어서, 범용 시계열 분석을 적용합니다.",
        basis: "시각화매핑규칙 §2.4 CUSTOM_TS → AREA(추이)",
      });
    }
    reasons.push({
      chartName: "요약 테이블",
      reason: "감지된 수치 컬럼의 기본 통계(평균, 최대, 최소)를 요약합니다.",
      basis: "시각화매핑규칙 §2.4 CUSTOM → TABLE(통계)",
    });
    reasons.push({
      chartName: "데이터 테이블",
      reason: "원본 데이터를 그대로 보여주어 직접 확인할 수 있습니다.",
      basis: "시각화매핑규칙 §2.4 Fallback: TABLE(원본)",
    });

    return {
      dataTypeLabel: `커스텀 데이터 (${subType ?? "CUSTOM"})`,
      totalCharts: reasons.length,
      reasons,
      overallReason: `표준 투자 데이터 구조와 일치하지 않아, 범용 분석 모드로 ${reasons.length}개 차트를 자동 배정했습니다.`,
    };
  }

  // 기본 fallback
  return {
    dataTypeLabel: "미분류 데이터",
    totalCharts: 1,
    reasons: [
      {
        chartName: "데이터 테이블",
        reason: "데이터 유형을 특정할 수 없어, 원본 데이터를 테이블로 표시합니다.",
        basis: "Fallback 체인 규칙 (H3)",
      },
    ],
    overallReason:
      "데이터 유형을 자동 감지하지 못해 원본 데이터를 보여드립니다. 컬럼명을 확인해 주세요.",
  };
}
