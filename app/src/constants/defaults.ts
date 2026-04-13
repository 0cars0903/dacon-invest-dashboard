/**
 * InvestLens 기본값 상수
 * InsightConfig 기본값, 분석 파이프라인 설정
 */

import type { InsightConfig } from '@/types';

export const DEFAULT_INSIGHT_CONFIG: InsightConfig = {
  returnThresholds: {
    strongPositive: 20,
    weakNegative: -10,
    strongNegative: -10,
  },
  volatilityThresholds: {
    high: 40,
    elevated: 25,
    low: 15,
  },
  mddThresholds: {
    severe: -30,
    moderate: -15,
    mild: -5,
  },
  rsiThresholds: {
    overbought: 70,
    oversold: 30,
  },
  concentrationThresholds: {
    singleAssetMax: 50,
    categoryMax: 60,
    hhiHigh: 0.25,
    hhiLow: 0.15,
  },
  riskFreeRate: 3.5,
  marketCrashThreshold: -5,
  displayMode: 'simple',
};

/** 파일 업로드 제한 */
export const UPLOAD_LIMITS = {
  maxRows: 100_000,
  minRows: 5,
  maxFileSizeMB: 50,
  supportedFormats: ['.csv', '.json'] as const,
} as const;

/** MA 기간 (빈도별) */
export const MA_PERIODS = {
  minute: { short: 5, mid: 15, long: 30 },
  hourly: { short: 6, mid: 12, long: 24 },
  daily: { short: 20, mid: 60, long: 120 },
  weekly: { short: 4, mid: 13, long: 26 },
  monthly: { short: 3, mid: 6, long: 12 },
} as const;
