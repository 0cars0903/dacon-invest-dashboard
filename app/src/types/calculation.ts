/**
 * 지표계산규칙 v2.1 — CalculationResult 인터페이스
 * Skills.md Module 2/4 대응
 */

export type AnomalyType = 'split_suspect' | 'price_error' | 'halt_suspect';

export interface Anomaly {
  date: string;
  type: AnomalyType;
  value: number;
  description: string;
}

export interface CrossoverEvent {
  date: string;
  type: 'golden' | 'dead';
  volumeConfirmed: boolean;
}

export interface NormalizedPrice {
  ticker: string;
  dates: string[];
  values: number[]; // Base-100 indexed
}

export interface MultiFactorScore {
  name: string;
  score: number; // 0~1
  rank: number;
}

export interface Indicator {
  id: string;
  name: string;
  category: 'required' | 'optional';
  value: number | number[] | Record<string, number>;
  unit: '%' | '$' | '원' | 'ratio' | 'index';
  timeSeries?: {
    dates: string[];
    values: number[];
  };
  metadata?: {
    period?: string;
    benchmark?: string;
    nullCount: number;
  };
}

export interface CalculationSummary {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio?: number;
  mdd: number;
}

export interface CalculationResult {
  dataType: string;
  fallbackMode: boolean;
  anomalies: Anomaly[];
  indicators: Indicator[];
  crossoverEvents?: CrossoverEvent[];
  normalizedPrices?: NormalizedPrice[];
  multiFactorScores?: MultiFactorScore[];
  summary: CalculationSummary;
}
