/**
 * 인사이트생성규칙 v2.1 — Insight & InsightResult 인터페이스
 * Skills.md Module 4/4 대응
 */

export type InsightLevel = 'alert' | 'warning' | 'info' | 'positive';

export type InsightDepth =
  | 'descriptive'
  | 'diagnostic'
  | 'predictive'
  | 'prescriptive';

export type DisplayMode = 'simple' | 'expert';

export interface Insight {
  id: string;
  level: InsightLevel;
  priority: number; // 1(최고) ~ 10(최저)
  title: string;
  titleSimple: string;
  description: string;
  descriptionSimple: string;
  relatedIndicator: string;
  relatedChart?: string;
  value: number | string;
  valueContext?: string;
  insightDepth: InsightDepth;
  icon: string;
}

export interface InsightConfig {
  returnThresholds: {
    strongPositive: number; // 기본 +20%
    weakNegative: number; // 기본 -10%
    strongNegative: number; // 기본 -10%
  };
  volatilityThresholds: {
    high: number; // 기본 40%
    elevated: number; // 기본 25%
    low: number; // 기본 15%
  };
  mddThresholds: {
    severe: number; // 기본 -30%
    moderate: number; // 기본 -15%
    mild: number; // 기본 -5%
  };
  rsiThresholds: {
    overbought: number; // 기본 70
    oversold: number; // 기본 30
  };
  concentrationThresholds: {
    singleAssetMax: number; // 기본 50%
    categoryMax: number; // 기본 60%
    hhiHigh: number; // 기본 0.25
    hhiLow: number; // 기본 0.15
  };
  riskFreeRate: number; // 기본 3.5%
  marketCrashThreshold: number; // 기본 -5%
  displayMode: DisplayMode;
}

export interface NarrativeProfile {
  label: string; // "안정-분산형" | "공격-집중형" | "균형형"
  consistent: boolean;
  inconsistencies: string[];
}

export interface KpiCard {
  indicator: string;
  value: string;
  change?: string;
  changeDirection: 'up' | 'down' | 'neutral';
  subtitle: string;
  level: InsightLevel;
}

export interface TopBanner {
  insight: Insight;
  summaryText: string;
  backgroundColor: string;
  textColor: string;
}

export interface InsightResult {
  config: InsightConfig;
  insights: Insight[];
  marketCrashDetected: boolean;
  narrativeProfile?: NarrativeProfile;
  topBanner: TopBanner | null;
  kpiCards: KpiCard[];
  summary: string;
  summaryExpert: string;
}
