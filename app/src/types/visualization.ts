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

/** 색상 팔레트 상수
 *  한국 증시 관례: 상승(up) = 빨강(red), 하락(down) = 파랑(blue)
 *  DESIGN.md §2-2 기준
 */
export const COLORS = {
  main: ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'] as const,
  up: '#EF4444',      // 상승 = 빨강 (한국 관례) — 이전: #10B981(초록)
  down: '#3B82F6',    // 하락 = 파랑 (한국 관례) — 이전: #EF4444(빨강)
  neutral: '#9CA3AF', // 보합 = 회색
  heatmap: {
    negative: '#3B82F6', // 하락/음수 = 파랑
    zero: '#F3F4F6',
    positive: '#EF4444', // 상승/양수 = 빨강
  },
  banner: {
    alert:    { bg: '#FEF2F2', text: '#991B1B' },
    warning:  { bg: '#FFFBEB', text: '#92400E' },
    positive: { bg: '#ECFDF5', text: '#065F46' },
    info:     { bg: '#EFF6FF', text: '#1E40AF' },
  },
  // Tailwind 클래스 (인라인 style 대신 사용)
  tw: {
    up:       'text-red-500',
    down:     'text-blue-500',
    neutral:  'text-gray-400',
    levelBorder: {
      alert:    'border-red-300 dark:border-red-700',
      warning:  'border-orange-300 dark:border-orange-600',
      info:     'border-gray-100 dark:border-gray-700',
      positive: 'border-emerald-300 dark:border-emerald-700',
    },
    levelBg: {
      alert:    'bg-red-50 dark:bg-red-950/30',
      warning:  'bg-amber-50 dark:bg-amber-950/30',
      info:     'bg-blue-50 dark:bg-blue-950/30',
      positive: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
  },
} as const;
