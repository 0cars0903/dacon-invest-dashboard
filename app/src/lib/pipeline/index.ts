/**
 * InvestLens 분석 파이프라인 — 진입점
 * 데이터감지 → 지표계산 → 인사이트생성 순서 실행
 */

import { detect } from './detect';
import { calculate } from './calculate';
import { generateInsights } from './insights';
import { DEFAULT_INSIGHT_CONFIG } from '@/constants/defaults';
import type { DetectionResult, CalculationResult, InsightResult } from '@/types';

// 개별 모듈도 re-export — 2탭 동기화 시 부분 재실행용
export { detect, calculate, generateInsights };

interface PipelineResult {
  detection: DetectionResult;
  calculation: CalculationResult;
  insights: InsightResult;
  rawData: Record<string, unknown>[];
}

export async function runPipeline(
  rawText: string,
  fileType: 'csv' | 'json'
): Promise<PipelineResult> {
  // Step 1: 데이터 감지
  const { detection, parsedData } = detect(rawText, fileType);

  // Step 2: 지표 계산
  const calculation = calculate(detection, parsedData);

  // Step 3: 인사이트 생성
  const insights = generateInsights(
    detection,
    calculation,
    DEFAULT_INSIGHT_CONFIG,
    parsedData
  );

  return {
    detection,
    calculation,
    insights,
    rawData: parsedData,
  };
}
