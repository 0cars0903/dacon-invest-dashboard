/**
 * 시각화매핑규칙 v2.1 — 차트 설정 인터페이스
 * Skills.md Module 3/4 대응
 */

export type ChartType =
  | 'LINE'
  | 'AREA'
  | 'BAR'
  | 'COMPOSED'
  | 'PIE'
  | 'RADAR'
  | 'SCATTER'
  | 'HEATMAP'
  | 'TREEMAP'
  | 'CANDLESTICK'
  | 'BUBBLE'
  | 'TABLE';

export type CardSize = 'FULL' | 'HALF' | 'QUARTER';

export interface ChartAssignment {
  order: number;
  indicatorId: string;
  chartType: ChartType;
  cardSize: CardSize;
  title: string;
  description?: string;
  conditional?: boolean; // 조건부 렌더링 여부
}

export interface CustomChart {
  id: string;
  name: string;
  component: string;
  size: CardSize;
  indicatorId: string;
}

export interface ChartConfig {
  overrides?: {
    dataType: string;
    chartOrder: string[];
    hiddenCharts?: string[];
    customCharts?: CustomChart[];
  }[];
}

/** 색상 팔레트 상수 */
export const COLORS = {
  main: ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'] as const,
  up: '#10B981',
  down: '#EF4444',
  neutral: '#6B7280',
  heatmap: {
    negative: '#3B82F6',
    zero: '#F3F4F6',
    positive: '#EF4444',
  },
  banner: {
    alert: { bg: '#FEF2F2', text: '#991B1B' },
    warning: { bg: '#FFFBEB', text: '#92400E' },
    positive: { bg: '#ECFDF5', text: '#065F46' },
    info: { bg: '#EFF6FF', text: '#1E40AF' },
  },
} as const;
