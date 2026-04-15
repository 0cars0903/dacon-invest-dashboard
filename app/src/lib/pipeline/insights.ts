/**
 * 인사이트생성규칙 v2.1 구현
 * DetectionResult + CalculationResult → InsightResult
 */

import type {
  DetectionResult,
  CalculationResult,
  InsightResult,
  InsightConfig,
  Insight,
  InsightLevel,
  InsightDepth,
  KpiCard,
  TopBanner,
  NarrativeProfile,
} from "@/types";
import { COLORS } from "@/types/visualization";

let insightCounter = 0;
function nextId(): string {
  return `insight_${++insightCounter}`;
}

/**
 * 경고 색상 조건부 렌더링 (시각화매핑규칙 v2.2 §9)
 * 지표 값 → InsightLevel 매핑 유틸리티
 */
export function getIndicatorLevel(
  indicatorId: string,
  value: number
): InsightLevel {
  switch (indicatorId) {
    case "mdd": {
      // MDD는 음수 (예: -30%)
      if (value < -30) return "alert";
      if (value < -15) return "warning";
      if (value > -5) return "positive";
      return "info";
    }
    case "volatility": {
      // 연환산 변동성 (%)
      if (value > 40) return "alert";
      if (value > 25) return "warning";
      if (value < 10) return "positive";
      return "info";
    }
    case "rsi": {
      if (value > 70 || value < 30) return "warning";
      if (value >= 40 && value <= 60) return "positive";
      return "info";
    }
    case "sharpe_ratio": {
      if (value < 0) return "warning";
      if (value > 1) return "positive";
      return "info";
    }
    case "premium_discount": {
      const abs = Math.abs(value);
      if (abs > 2) return "alert";
      if (abs > 1) return "warning";
      if (abs <= 0.5) return "positive";
      return "info";
    }
    case "tracking_error": {
      if (value > 2) return "alert";
      if (value > 1) return "warning";
      if (value <= 0.5) return "positive";
      return "info";
    }
    case "hhi": {
      if (value > 0.5) return "warning";
      if (value < 0.15) return "positive";
      return "info";
    }
    default:
      return "info";
  }
}

function makeInsight(
  partial: Omit<Insight, "id">
): Insight {
  return { id: nextId(), ...partial };
}

/* ── STOCK_TS 인사이트 ─────────────────────────── */

function stockInsights(
  calc: CalculationResult,
  config: InsightConfig
): Insight[] {
  const insights: Insight[] = [];
  const { summary } = calc;
  const tr = summary.totalReturn * 100;

  // 수익률 기반
  if (tr > config.returnThresholds.strongPositive) {
    insights.push(makeInsight({
      level: "positive", priority: 2, insightDepth: "descriptive",
      title: `전체 기간 ${tr.toFixed(1)}% 상승, 강한 상승 추세`,
      titleSimple: `많이 올랐어요! 약 ${tr.toFixed(0)}% 수익 중`,
      description: `전체 기간 동안 ${tr.toFixed(1)}%의 수익률을 기록하며 강한 상승 추세를 보이고 있습니다.`,
      descriptionSimple: `투자 시작 이후 약 ${tr.toFixed(0)}%나 올랐어요. 좋은 흐름이에요!`,
      relatedIndicator: "cumulative_return", value: tr,
      valueContext: "전체 기간 기준", icon: "✅",
    }));
  } else if (tr > 0) {
    insights.push(makeInsight({
      level: "info", priority: 5, insightDepth: "descriptive",
      title: `전체 기간 ${tr.toFixed(1)}% 수익 달성`,
      titleSimple: `플러스 수익 중이에요 (+${tr.toFixed(1)}%)`,
      description: `전체 기간 ${tr.toFixed(1)}%의 양의 수익률을 기록하고 있습니다.`,
      descriptionSimple: `조금씩 오르고 있어요. 현재 +${tr.toFixed(1)}% 수익이에요.`,
      relatedIndicator: "cumulative_return", value: tr,
      valueContext: "전체 기간 기준", icon: "ℹ️",
    }));
  } else if (tr > config.returnThresholds.weakNegative) {
    insights.push(makeInsight({
      level: "warning", priority: 3, insightDepth: "descriptive",
      title: `전체 기간 ${tr.toFixed(1)}% 하락, 조정 구간`,
      titleSimple: `조금 빠졌어요 (${tr.toFixed(1)}%)`,
      description: `전체 기간 ${tr.toFixed(1)}% 하락하며 조정 구간에 있습니다.`,
      descriptionSimple: `약간 내려갔지만 아직 크게 걱정할 수준은 아니에요.`,
      relatedIndicator: "cumulative_return", value: tr,
      valueContext: "전체 기간 기준", icon: "🔔",
    }));
  } else {
    insights.push(makeInsight({
      level: "alert", priority: 1, insightDepth: "descriptive",
      title: `전체 기간 ${tr.toFixed(1)}% 하락, 하락 추세 지속`,
      titleSimple: `많이 빠졌어요 (${tr.toFixed(1)}%)`,
      description: `전체 기간 ${tr.toFixed(1)}%의 큰 폭 하락이 발생했습니다.`,
      descriptionSimple: `꽤 많이 내려갔어요. 주의가 필요한 시점이에요.`,
      relatedIndicator: "cumulative_return", value: tr,
      valueContext: "전체 기간 기준", icon: "⚠️",
    }));
  }

  // 변동성
  const vol = summary.volatility * 100;
  if (vol > config.volatilityThresholds.high) {
    insights.push(makeInsight({
      level: "alert", priority: 2, insightDepth: "diagnostic",
      title: `연환산 변동성 ${vol.toFixed(1)}%, 매우 높은 위험`,
      titleSimple: "가격 변동이 매우 커요",
      description: `연환산 변동성이 ${vol.toFixed(1)}%로 매우 높습니다.`,
      descriptionSimple: `가격이 크게 출렁이고 있어요. 조심해서 지켜보세요.`,
      relatedIndicator: "volatility", value: vol,
      valueContext: "연환산 기준", icon: "⚠️",
    }));
  } else if (vol > config.volatilityThresholds.elevated) {
    insights.push(makeInsight({
      level: "warning", priority: 4, insightDepth: "diagnostic",
      title: `변동성 ${vol.toFixed(1)}%로 평균 이상`,
      titleSimple: "변동이 좀 있는 편이에요",
      description: `연환산 변동성이 ${vol.toFixed(1)}%로 평균 이상입니다.`,
      descriptionSimple: `가격 움직임이 보통보다 큰 편이에요.`,
      relatedIndicator: "volatility", value: vol,
      valueContext: "연환산 기준", icon: "🔔",
    }));
  } else if (vol < config.volatilityThresholds.low && vol > 0) {
    insights.push(makeInsight({
      level: "positive", priority: 6, insightDepth: "descriptive",
      title: `변동성 ${vol.toFixed(1)}%로 안정적 흐름`,
      titleSimple: "안정적으로 움직이고 있어요",
      description: `연환산 변동성이 ${vol.toFixed(1)}%로 낮아 안정적입니다.`,
      descriptionSimple: `가격이 크게 흔들리지 않고 있어요.`,
      relatedIndicator: "volatility", value: vol,
      valueContext: "연환산 기준", icon: "✅",
    }));
  }

  // MDD
  const mdd = summary.mdd * 100;
  if (mdd < config.mddThresholds.severe) {
    insights.push(makeInsight({
      level: "alert", priority: 1, insightDepth: "diagnostic",
      title: `최대 낙폭 ${mdd.toFixed(1)}%, 심각한 하락`,
      titleSimple: "큰 폭의 하락이 있었어요",
      description: `고점 대비 ${mdd.toFixed(1)}%까지 하락한 구간이 존재합니다.`,
      descriptionSimple: `한때 많이 떨어진 적이 있어요. 약 ${Math.abs(mdd).toFixed(0)}% 정도요.`,
      relatedIndicator: "mdd", value: mdd,
      valueContext: "고점 대비", icon: "⚠️",
    }));
  } else if (mdd < config.mddThresholds.moderate) {
    insights.push(makeInsight({
      level: "warning", priority: 3, insightDepth: "diagnostic",
      title: `최대 낙폭 ${mdd.toFixed(1)}%, 의미 있는 조정`,
      titleSimple: "중간 정도의 하락이 있었어요",
      description: `고점 대비 ${mdd.toFixed(1)}%의 조정이 발생했습니다.`,
      descriptionSimple: `한때 약 ${Math.abs(mdd).toFixed(0)}% 정도 내려간 적이 있어요.`,
      relatedIndicator: "mdd", value: mdd,
      valueContext: "고점 대비", icon: "🔔",
    }));
  } else if (mdd > config.mddThresholds.mild) {
    insights.push(makeInsight({
      level: "positive", priority: 7, insightDepth: "descriptive",
      title: `최대 낙폭 ${mdd.toFixed(1)}%로 매우 안정적`,
      titleSimple: "하락폭이 아주 작아요",
      description: `최대 낙폭이 ${mdd.toFixed(1)}%에 불과하여 매우 안정적입니다.`,
      descriptionSimple: `크게 떨어진 적이 거의 없어요. 안정적이에요!`,
      relatedIndicator: "mdd", value: mdd,
      valueContext: "고점 대비", icon: "✅",
    }));
  }

  // RSI
  const rsiInd = calc.indicators.find((i) => i.id === "rsi");
  if (rsiInd && typeof rsiInd.value === "number") {
    const rsi = rsiInd.value;
    if (rsi > config.rsiThresholds.overbought) {
      insights.push(makeInsight({
        level: "warning", priority: 3, insightDepth: "diagnostic",
        title: `RSI ${rsi.toFixed(1)}, 과매수 구간 진입`,
        titleSimple: "매수 과열 신호",
        description: `RSI 14일 기준 ${rsi.toFixed(1)}로 과매수 구간(>${config.rsiThresholds.overbought}) 진입.`,
        descriptionSimple: `최근 많이 올라서 잠시 쉬어갈 수 있어요.`,
        relatedIndicator: "rsi", value: rsi,
        valueContext: "14일 기준", icon: "🔔",
      }));
    } else if (rsi < config.rsiThresholds.oversold) {
      insights.push(makeInsight({
        level: "warning", priority: 3, insightDepth: "diagnostic",
        title: `RSI ${rsi.toFixed(1)}, 과매도 구간 진입`,
        titleSimple: "매도 과열 신호",
        description: `RSI 14일 기준 ${rsi.toFixed(1)}로 과매도 구간(<${config.rsiThresholds.oversold}) 진입.`,
        descriptionSimple: `최근 많이 빠져서 반등할 수도 있어요.`,
        relatedIndicator: "rsi", value: rsi,
        valueContext: "14일 기준", icon: "🔔",
      }));
    }
  }

  // 골든/데드크로스
  if (calc.crossoverEvents && calc.crossoverEvents.length > 0) {
    const latest = calc.crossoverEvents[calc.crossoverEvents.length - 1];
    if (latest.type === "golden") {
      insights.push(makeInsight({
        level: latest.volumeConfirmed ? "positive" : "info",
        priority: latest.volumeConfirmed ? 1 : 3,
        insightDepth: "diagnostic",
        title: `골든크로스 감지(${latest.date})${latest.volumeConfirmed ? ", 거래량 확인" : ""}`,
        titleSimple: latest.volumeConfirmed
          ? "상승 전환 신호가 나왔어요!"
          : "상승 신호가 있지만 확인 필요",
        description: `${latest.date}에 단기 이동평균이 중기를 상향 돌파.${latest.volumeConfirmed ? " 거래량도 뒷받침." : " 거래량 미확인."}`,
        descriptionSimple: latest.volumeConfirmed
          ? "상승 전환 신호가 나왔어요! 거래량도 뒷받침하고 있어요."
          : "상승 신호가 있지만 아직 확실하지 않아요.",
        relatedIndicator: `ma_${20}`, value: latest.date,
        valueContext: "이동평균 교차 기준", icon: latest.volumeConfirmed ? "✅" : "ℹ️",
      }));
    } else {
      insights.push(makeInsight({
        level: latest.volumeConfirmed ? "alert" : "warning",
        priority: latest.volumeConfirmed ? 1 : 3,
        insightDepth: "diagnostic",
        title: `데드크로스 감지(${latest.date})${latest.volumeConfirmed ? ", 거래량 확인" : ""}`,
        titleSimple: latest.volumeConfirmed
          ? "하락 전환 신호에요!"
          : "하락 신호가 있지만 확인 필요",
        description: `${latest.date}에 단기 이동평균이 중기를 하향 돌파.${latest.volumeConfirmed ? " 거래량도 뒷받침." : " 거래량 미확인."}`,
        descriptionSimple: latest.volumeConfirmed
          ? "하락 전환 신호에요! 주의가 필요해요."
          : "하락 신호가 있지만 아직 지켜볼 단계예요.",
        relatedIndicator: `ma_${20}`, value: latest.date,
        valueContext: "이동평균 교차 기준", icon: latest.volumeConfirmed ? "⚠️" : "🔔",
      }));
    }
  }

  return insights;
}

/* ── ETF_COMP 전용 인사이트 ─────────────────────── */

function etfCompInsights(
  calc: CalculationResult,
  config: InsightConfig,
  detection: DetectionResult
): Insight[] {
  const insights: Insight[] = [];
  const { summary } = calc;

  // 1. 성과 비교 인사이트
  const tr = summary.totalReturn * 100;
  if (tr > config.returnThresholds.strongPositive) {
    insights.push(makeInsight({
      level: "positive", priority: 2, insightDepth: "descriptive",
      title: `비교 그룹 전체 기간 평균 ${tr.toFixed(1)}% 상승`,
      titleSimple: `비교 종목들이 전체적으로 많이 올랐어요 (+${tr.toFixed(0)}%)`,
      description: `비교 대상 종목의 대표 시계열이 ${tr.toFixed(1)}% 상승을 기록했습니다.`,
      descriptionSimple: `비교하고 있는 종목들이 전반적으로 좋은 성과를 보이고 있어요.`,
      relatedIndicator: "cumulative_return", value: tr,
      valueContext: "전체 기간 기준", icon: "✅",
    }));
  } else if (tr < config.returnThresholds.weakNegative) {
    insights.push(makeInsight({
      level: "alert", priority: 1, insightDepth: "descriptive",
      title: `비교 그룹 전체 기간 ${tr.toFixed(1)}% 하락`,
      titleSimple: `비교 종목들이 전체적으로 하락세에요 (${tr.toFixed(1)}%)`,
      description: `비교 대상 종목의 대표 시계열이 ${tr.toFixed(1)}% 하락했습니다.`,
      descriptionSimple: `비교하고 있는 종목들이 전반적으로 부진한 상황이에요.`,
      relatedIndicator: "cumulative_return", value: tr,
      valueContext: "전체 기간 기준", icon: "⚠️",
    }));
  }

  // 2. 위험-수익 인사이트 (샤프 비율)
  if (summary.sharpeRatio != null) {
    const sr = summary.sharpeRatio;
    if (sr > 1) {
      insights.push(makeInsight({
        level: "positive", priority: 3, insightDepth: "diagnostic",
        title: `위험 대비 수익 우수 (샤프 ${sr.toFixed(2)})`,
        titleSimple: "위험 대비 수익이 좋은 편이에요",
        description: `샤프 비율 ${sr.toFixed(2)}로 위험 대비 양호한 수익을 보이고 있습니다.`,
        descriptionSimple: `투자 위험 대비 수익이 괜찮은 편이에요.`,
        relatedIndicator: "sharpe_ratio", value: sr,
        valueContext: "연환산 기준", icon: "✅",
      }));
    } else if (sr < 0) {
      insights.push(makeInsight({
        level: "warning", priority: 3, insightDepth: "diagnostic",
        title: `위험 대비 수익 부정 (샤프 ${sr.toFixed(2)})`,
        titleSimple: "위험에 비해 수익이 안 좋아요",
        description: `샤프 비율 ${sr.toFixed(2)}로 위험 대비 수익이 부정적입니다.`,
        descriptionSimple: `투자 위험에 비해 수익이 좋지 않은 상황이에요.`,
        relatedIndicator: "sharpe_ratio", value: sr,
        valueContext: "연환산 기준", icon: "🔔",
      }));
    }
  }

  // 3. 변동성 비교
  const vol = summary.volatility * 100;
  if (vol > config.volatilityThresholds.high) {
    insights.push(makeInsight({
      level: "alert", priority: 2, insightDepth: "diagnostic",
      title: `비교 그룹 변동성 ${vol.toFixed(1)}%, 높은 위험`,
      titleSimple: "비교 종목들의 가격 변동이 커요",
      description: `비교 대상 종목들의 평균 연환산 변동성이 ${vol.toFixed(1)}%로 높습니다.`,
      descriptionSimple: `비교하고 있는 종목들의 가격 움직임이 큰 편이에요.`,
      relatedIndicator: "volatility", value: vol,
      valueContext: "연환산 기준", icon: "⚠️",
    }));
  }

  // 4. MDD 인사이트
  const mdd = summary.mdd * 100;
  if (mdd < config.mddThresholds.severe) {
    insights.push(makeInsight({
      level: "alert", priority: 1, insightDepth: "diagnostic",
      title: `최대 낙폭 ${mdd.toFixed(1)}%, 심각한 하락 이력`,
      titleSimple: "큰 하락이 있었어요",
      description: `고점 대비 ${mdd.toFixed(1)}%까지 하락한 구간이 존재합니다.`,
      descriptionSimple: `한때 약 ${Math.abs(mdd).toFixed(0)}% 정도 크게 떨어진 적이 있어요.`,
      relatedIndicator: "mdd", value: mdd,
      valueContext: "고점 대비", icon: "⚠️",
    }));
  }

  // 5. 괴리율 인사이트 (§7 ETF 전용)
  if (calc.etfMetrics?.premiumDiscount) {
    const pd = calc.etfMetrics.premiumDiscount;
    const abs = Math.abs(pd.current);
    if (pd.level === "alert") {
      insights.push(makeInsight({
        level: "alert", priority: 1, insightDepth: "prescriptive",
        title: `괴리율 ${pd.current > 0 ? "+" : ""}${pd.current.toFixed(2)}%, ${pd.label}`,
        titleSimple: pd.current > 0 ? "시장가가 실제 가치보다 많이 비싸요!" : "시장가가 실제 가치보다 많이 싸요!",
        description: `NAV 대비 괴리율이 ${pd.current.toFixed(2)}%로 ±2%를 초과합니다. 비정상 거래 가능성을 점검하세요.`,
        descriptionSimple: pd.current > 0
          ? `ETF 시장가가 실제 자산 가치보다 ${abs.toFixed(1)}%나 비싸요. 매수 시 주의가 필요해요.`
          : `ETF 시장가가 실제 자산 가치보다 ${abs.toFixed(1)}%나 싸요. 유동성을 확인해 보세요.`,
        relatedIndicator: "premium_discount", value: pd.current,
        valueContext: "NAV 대비", icon: "⚠️",
      }));
    } else if (pd.level === "warning") {
      insights.push(makeInsight({
        level: "warning", priority: 3, insightDepth: "diagnostic",
        title: `괴리율 ${pd.current > 0 ? "+" : ""}${pd.current.toFixed(2)}%, ${pd.label}`,
        titleSimple: pd.current > 0 ? "시장가가 실제 가치보다 좀 비싼 편이에요" : "시장가가 실제 가치보다 좀 싼 편이에요",
        description: `NAV 대비 괴리율이 ${pd.current.toFixed(2)}%로 주의 구간(±1~2%)에 있습니다.`,
        descriptionSimple: pd.current > 0
          ? `시장가가 실제 가치보다 약 ${abs.toFixed(1)}% 비싸요. 지켜볼 필요가 있어요.`
          : `시장가가 실제 가치보다 약 ${abs.toFixed(1)}% 싸요.`,
        relatedIndicator: "premium_discount", value: pd.current,
        valueContext: "NAV 대비", icon: "🔔",
      }));
    } else if (pd.level === "normal") {
      insights.push(makeInsight({
        level: "positive", priority: 6, insightDepth: "descriptive",
        title: `괴리율 ${pd.current.toFixed(2)}%, 정상 범위`,
        titleSimple: "시장가와 실제 가치가 거의 같아요",
        description: `NAV 대비 괴리율이 ${pd.current.toFixed(2)}%로 정상 범위(±0.5%) 내에 있습니다.`,
        descriptionSimple: `ETF 시장가가 실제 자산 가치와 거의 일치해요. 정상적이에요!`,
        relatedIndicator: "premium_discount", value: pd.current,
        valueContext: "NAV 대비", icon: "✅",
      }));
    }
  }

  // 6. 추적오차 인사이트 (§7 ETF 전용)
  if (calc.etfMetrics?.trackingError) {
    const te = calc.etfMetrics.trackingError;
    if (te.level === "alert") {
      insights.push(makeInsight({
        level: "alert", priority: 2, insightDepth: "prescriptive",
        title: `추적오차 ${te.annualized.toFixed(2)}%, 벤치마크 괴리 심각`,
        titleSimple: "벤치마크와 너무 다르게 움직이고 있어요!",
        description: `연환산 추적오차가 ${te.annualized.toFixed(2)}%로 2%를 초과합니다. ETF 운용 효율을 점검하세요.`,
        descriptionSimple: `ETF가 기준 지수를 제대로 따라가지 못하고 있어요. 다른 ETF를 비교해 보세요.`,
        relatedIndicator: "tracking_error", value: te.annualized,
        valueContext: "연환산 기준", icon: "⚠️",
      }));
    } else if (te.level === "warning") {
      insights.push(makeInsight({
        level: "warning", priority: 4, insightDepth: "diagnostic",
        title: `추적오차 ${te.annualized.toFixed(2)}%, 주의 필요`,
        titleSimple: "벤치마크와 조금 다르게 움직이고 있어요",
        description: `연환산 추적오차가 ${te.annualized.toFixed(2)}%로 주의 구간(1~2%)에 있습니다.`,
        descriptionSimple: `ETF가 기준 지수와 약간 차이를 보이고 있어요.`,
        relatedIndicator: "tracking_error", value: te.annualized,
        valueContext: "연환산 기준", icon: "🔔",
      }));
    } else if (te.level === "positive") {
      insights.push(makeInsight({
        level: "positive", priority: 7, insightDepth: "descriptive",
        title: `추적오차 ${te.annualized.toFixed(2)}%, 벤치마크 추종 우수`,
        titleSimple: "벤치마크를 잘 따라가고 있어요",
        description: `연환산 추적오차가 ${te.annualized.toFixed(2)}%로 매우 낮아 추적 효율이 우수합니다.`,
        descriptionSimple: `ETF가 기준 지수를 잘 따라가고 있어요. 좋은 ETF예요!`,
        relatedIndicator: "tracking_error", value: te.annualized,
        valueContext: "연환산 기준", icon: "✅",
      }));
    }
  }

  // RSI, 크로스오버는 stockInsights 재활용
  const stockIns = stockInsights(calc, config);
  const rsiAndCross = stockIns.filter(
    (i) => i.relatedIndicator === "rsi" || i.relatedIndicator.startsWith("ma_")
  );
  insights.push(...rsiAndCross);

  return insights;
}

/* ── PORT_ALLOC 인사이트 ───────────────────────── */

function portfolioInsights(
  calc: CalculationResult,
  config: InsightConfig,
  detection: DetectionResult,
  rawData: Record<string, unknown>[]
): Insight[] {
  const insights: Insight[] = [];
  const hhi = calc.indicators.find((i) => i.id === "hhi");

  if (hhi && typeof hhi.value === "number") {
    if (hhi.value > config.concentrationThresholds.hhiHigh) {
      insights.push(makeInsight({
        level: "warning", priority: 3, insightDepth: "prescriptive",
        title: `자산 집중도 높음 (HHI: ${hhi.value.toFixed(2)})`,
        titleSimple: "자산이 한쪽에 치우쳐 있어요",
        description: `HHI ${hhi.value.toFixed(2)}로 집중도가 높습니다. 리밸런싱을 고려하세요.`,
        descriptionSimple: `투자가 한쪽에 몰려 있어요. 분산을 고려해 보세요.`,
        relatedIndicator: "hhi", value: hhi.value,
        valueContext: "허핀달-허쉬만 지수", icon: "🔔",
      }));
    } else if (hhi.value < config.concentrationThresholds.hhiLow) {
      insights.push(makeInsight({
        level: "positive", priority: 4, insightDepth: "descriptive",
        title: `자산 분산도 양호 (HHI: ${hhi.value.toFixed(2)})`,
        titleSimple: "자산이 골고루 분산되어 있어요",
        description: `HHI ${hhi.value.toFixed(2)}로 분산이 양호합니다.`,
        descriptionSimple: `여러 자산에 골고루 투자하고 있어요. 좋은 구성이에요!`,
        relatedIndicator: "hhi", value: hhi.value,
        valueContext: "허핀달-허쉬만 지수", icon: "✅",
      }));
    }
  }

  // 가중 수익률 인사이트
  const wrInd = calc.indicators.find((i) => i.id === "weighted_return");
  if (wrInd && typeof wrInd.value === "number") {
    const wr = wrInd.value * 100;
    if (wr > 0) {
      insights.push(makeInsight({
        level: "positive", priority: 4, insightDepth: "descriptive",
        title: `가중 수익률 +${wr.toFixed(1)}%`,
        titleSimple: `포트폴리오 전체 수익 +${wr.toFixed(1)}%`,
        description: `비중 가중 기준 포트폴리오 수익률이 ${wr.toFixed(1)}%입니다.`,
        descriptionSimple: `포트폴리오 전체적으로 플러스 수익이에요.`,
        relatedIndicator: "weighted_return", value: wr,
        valueContext: "비중 가중", icon: "✅",
      }));
    } else {
      insights.push(makeInsight({
        level: "warning", priority: 3, insightDepth: "descriptive",
        title: `가중 수익률 ${wr.toFixed(1)}%`,
        titleSimple: `포트폴리오 전체 수익 ${wr.toFixed(1)}%`,
        description: `비중 가중 기준 포트폴리오 수익률이 ${wr.toFixed(1)}%로 마이너스입니다.`,
        descriptionSimple: `포트폴리오 전체적으로 마이너스 수익이에요.`,
        relatedIndicator: "weighted_return", value: wr,
        valueContext: "비중 가중", icon: "🔔",
      }));
    }
  }

  return insights;
}

/* ── Market Crash Detection (ETF_COMP §5) ──────── */

function detectMarketCrash(
  calc: CalculationResult,
  detection: DetectionResult,
  rawData: Record<string, unknown>[],
  threshold: number
): boolean {
  // ETF_COMP에서만 적용: 70%+ 종목이 2일간 threshold% 이상 하락
  if (detection.dataType !== "ETF_COMP") return false;

  const dailyRet = calc.indicators.find((i) => i.id === "daily_return");
  if (!dailyRet?.timeSeries || dailyRet.timeSeries.values.length < 2) return false;

  const returns = dailyRet.timeSeries.values;
  // 마지막 2일 수익률 합산
  const last2 = returns.slice(-2);
  const cumDrop = last2.reduce((s, v) => s + v, 0) * 100;

  // 단일 시계열에서는 전체 하락 여부만 확인
  if (cumDrop < threshold) return true;

  return false;
}

/* ── Narrative Consistency (PORT_ALLOC §5a) ─────── */

function buildNarrativeProfile(
  calc: CalculationResult,
  detection: DetectionResult,
  rawData: Record<string, unknown>[]
): NarrativeProfile | undefined {
  if (detection.dataType !== "PORT_ALLOC") return undefined;

  const hhi = calc.indicators.find((i) => i.id === "hhi");
  const hhiVal = hhi && typeof hhi.value === "number" ? hhi.value : 0;

  const weightCol = detection.columns.find((c) => c.role === "weight");
  if (!weightCol) return undefined;

  const weights = rawData.map((r) => Number(r[weightCol.name]) || 0);
  const total = weights.reduce((a, b) => a + b, 0);
  const normWeights = total > 0 ? weights.map((w) => w / total) : weights;
  const maxWeight = Math.max(...normWeights) * 100;

  // 프로필 분류
  let label: string;
  const inconsistencies: string[] = [];

  if (hhiVal < 0.15 && maxWeight < 30) {
    label = "안정-분산형";
    // 분산형인데 단일 자산 비중 > 40%이면 비일관
    if (maxWeight > 40) {
      inconsistencies.push(
        `분산형이나 최대 단일 자산 비중 ${maxWeight.toFixed(1)}%로 집중됨`
      );
    }
  } else if (hhiVal > 0.25 || maxWeight > 50) {
    label = "공격-집중형";
    // 집중형인데 수익률이 음수면 비일관
    const wr = calc.indicators.find((i) => i.id === "weighted_return");
    if (wr && typeof wr.value === "number" && wr.value < -0.1) {
      inconsistencies.push(
        "공격적 집중 투자이나 큰 폭의 손실 발생"
      );
    }
  } else {
    label = "균형형";
  }

  return {
    label,
    consistent: inconsistencies.length === 0,
    inconsistencies,
  };
}

/* ── KPI 카드 생성 ─────────────────────────────── */

function buildKpiCards(
  detection: DetectionResult,
  calc: CalculationResult,
  insights: Insight[],
  displayMode: "simple" | "expert"
): KpiCard[] {
  const { summary } = calc;
  const cards: KpiCard[] = [];

  const findInsight = (indicatorId: string) =>
    insights.find((i) => i.relatedIndicator === indicatorId);

  const subtitle = (ins: Insight | undefined) =>
    ins
      ? displayMode === "simple"
        ? ins.titleSimple
        : ins.title
      : "";

  if (detection.dataType === "STOCK_TS" || detection.dataType === "ETF_COMP") {
    const tr = summary.totalReturn * 100;
    cards.push({
      indicator: "총 수익률",
      value: `${tr >= 0 ? "+" : ""}${tr.toFixed(1)}%`,
      changeDirection: tr > 0 ? "up" : tr < 0 ? "down" : "neutral",
      subtitle: subtitle(findInsight("cumulative_return")),
      level: findInsight("cumulative_return")?.level ?? "info",
    });

    const vol = summary.volatility * 100;
    cards.push({
      indicator: "변동성 (가격 흔들림)",
      value: `${vol.toFixed(1)}%`,
      changeDirection: "neutral",
      subtitle: subtitle(findInsight("volatility")),
      level: findInsight("volatility")?.level ?? "info",
    });

    const mdd = summary.mdd * 100;
    cards.push({
      indicator: "MDD (최대 낙폭)",
      value: `${mdd.toFixed(1)}%`,
      changeDirection: "down",
      subtitle: subtitle(findInsight("mdd")),
      level: findInsight("mdd")?.level ?? "info",
    });

    // ETF_COMP: 괴리율 카드 우선, 없으면 샤프 비율
    if (detection.dataType === "ETF_COMP" && calc.etfMetrics?.premiumDiscount) {
      const pd = calc.etfMetrics.premiumDiscount;
      const pdLevel = pd.level === "normal" ? "positive" as const
        : pd.level === "info" ? "info" as const
        : pd.level === "warning" ? "warning" as const
        : "alert" as const;
      cards.push({
        indicator: "괴리율 (시장가 vs NAV)",
        value: `${pd.current >= 0 ? "+" : ""}${pd.current.toFixed(2)}%`,
        changeDirection: pd.current > 0 ? "up" : pd.current < 0 ? "down" : "neutral",
        subtitle: subtitle(findInsight("premium_discount")) || pd.label,
        level: pdLevel,
      });
    } else {
      cards.push({
        indicator: "샤프 비율 (위험 대비 수익)",
        value: summary.sharpeRatio != null ? summary.sharpeRatio.toFixed(2) : "N/A",
        changeDirection: (summary.sharpeRatio ?? 0) > 0 ? "up" : "down",
        subtitle: subtitle(findInsight("sharpe_ratio")),
        level: findInsight("sharpe_ratio")?.level ?? "info",
      });
    }
  } else if (detection.dataType === "PORT_ALLOC") {
    const wr = calc.indicators.find((i) => i.id === "weighted_return");
    if (wr && typeof wr.value === "number") {
      const v = wr.value * 100;
      cards.push({
        indicator: "가중 수익률",
        value: `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`,
        changeDirection: v > 0 ? "up" : "down",
        subtitle: subtitle(findInsight("weighted_return")),
        level: "info",
      });
    }
    cards.push({
      indicator: "자산 수",
      value: `${detection.rowCount}개`,
      changeDirection: "neutral",
      subtitle: `${detection.rowCount}개 자산 보유`,
      level: "info",
    });
    const hhi = calc.indicators.find((i) => i.id === "hhi");
    if (hhi && typeof hhi.value === "number") {
      cards.push({
        indicator: "집중도 (분산도 HHI)",
        value: hhi.value.toFixed(2),
        changeDirection: "neutral",
        subtitle: subtitle(findInsight("hhi")),
        level: findInsight("hhi")?.level ?? "info",
      });
    }
  }

  // 최소 4개 보장
  while (cards.length < 4) {
    cards.push({
      indicator: cards.length === 0 ? "행 수" : `컬럼 ${cards.length}`,
      value: cards.length === 0 ? `${detection.rowCount}` : "-",
      changeDirection: "neutral",
      subtitle: "",
      level: "info",
    });
  }

  return cards.slice(0, 4);
}

/* ── 요약 배너 ─────────────────────────────────── */

function buildBanner(
  insights: Insight[],
  displayMode: "simple" | "expert"
): TopBanner | null {
  if (insights.length === 0) return null;

  const sorted = [...insights].sort((a, b) => {
    const order: Record<InsightLevel, number> = { alert: 0, warning: 1, positive: 2, info: 3 };
    const diff = order[a.level] - order[b.level];
    return diff !== 0 ? diff : a.priority - b.priority;
  });

  const top = sorted[0];
  const bannerColors = COLORS.banner[top.level];

  const text = displayMode === "simple"
    ? `${top.titleSimple} — ${top.descriptionSimple}`
    : `${top.title} — ${top.description}`;

  return {
    insight: top,
    summaryText: text,
    backgroundColor: bannerColors.bg,
    textColor: bannerColors.text,
  };
}

/* ── 메인 generateInsights ─────────────────────── */

export function generateInsights(
  detection: DetectionResult,
  calc: CalculationResult,
  config: InsightConfig,
  rawData: Record<string, unknown>[] = []
): InsightResult {
  insightCounter = 0; // 리셋

  // Fallback 모드
  if (calc.fallbackMode) {
    const fallbackInsight = makeInsight({
      level: "info", priority: 10, insightDepth: "descriptive",
      title: "분석 가능한 투자 지표가 부족합니다",
      titleSimple: "기본 정보만 표시합니다",
      description: "계산 가능한 투자 지표가 부족하여 기본 통계만 제공합니다.",
      descriptionSimple: "데이터에서 투자 지표를 충분히 계산할 수 없어요. 기본 정보만 보여드릴게요.",
      relatedIndicator: "none", value: 0,
      valueContext: "", icon: "ℹ️",
    });
    return {
      config,
      insights: [fallbackInsight],
      marketCrashDetected: false,
      topBanner: buildBanner([fallbackInsight], config.displayMode),
      kpiCards: buildKpiCards(detection, calc, [fallbackInsight], config.displayMode),
      summary: "분석 가능한 투자 지표가 부족하여 기본 통계만 표시합니다.",
      summaryExpert: "필수 지표 계산 불가로 fallback 모드가 활성화되었습니다.",
    };
  }

  let insights: Insight[] = [];

  // 데이터 유형별 인사이트
  if (detection.dataType === "STOCK_TS") {
    insights = stockInsights(calc, config);
  } else if (detection.dataType === "ETF_COMP") {
    insights = etfCompInsights(calc, config, detection);
  } else if (detection.dataType === "PORT_ALLOC") {
    insights = portfolioInsights(calc, config, detection, rawData);
  }

  // 이상치 경고
  for (const anomaly of calc.anomalies.slice(0, 3)) {
    const levelMap: Record<string, InsightLevel> = {
      split_suspect: "warning",
      price_error: "alert",
      halt_suspect: "info",
    };
    insights.push(makeInsight({
      level: levelMap[anomaly.type] ?? "info",
      priority: anomaly.type === "price_error" ? 1 : 5,
      insightDepth: "diagnostic",
      title: anomaly.description,
      titleSimple: anomaly.type === "price_error"
        ? "비정상 가격 데이터 발견"
        : anomaly.type === "split_suspect"
        ? "급격한 가격 변동 감지"
        : "가격 변동 없는 구간 감지",
      description: anomaly.description,
      descriptionSimple: anomaly.type === "price_error"
        ? "데이터에 이상한 가격이 포함되어 있어요."
        : anomaly.type === "split_suspect"
        ? `${anomaly.date}에 가격이 크게 변했어요. 액면분할일 수 있어요.`
        : `일정 기간 가격 변동이 없었어요.`,
      relatedIndicator: "anomaly", value: anomaly.value,
      valueContext: anomaly.date, icon: anomaly.type === "price_error" ? "⚠️" : "🔔",
    }));
  }

  // Market Crash Detection (ETF_COMP §5)
  const marketCrashDetected = detectMarketCrash(
    calc, detection, rawData, config.marketCrashThreshold
  );
  if (marketCrashDetected) {
    insights.unshift(makeInsight({
      level: "alert", priority: 0, insightDepth: "predictive",
      title: "시장 급락 감지 — 대다수 종목 동반 하락",
      titleSimple: "시장 전체가 크게 빠지고 있어요!",
      description: `최근 2거래일간 대부분의 종목이 ${config.marketCrashThreshold}% 이상 하락하여 시장 급락으로 판단됩니다.`,
      descriptionSimple: "최근 거의 모든 종목이 함께 떨어지고 있어요. 시장 전체의 하락이에요.",
      relatedIndicator: "market_crash", value: config.marketCrashThreshold,
      valueContext: "2거래일 기준", icon: "🚨",
    }));
  }

  // Narrative Consistency (PORT_ALLOC §5a)
  const narrativeProfile = buildNarrativeProfile(calc, detection, rawData);
  if (narrativeProfile && !narrativeProfile.consistent) {
    for (const issue of narrativeProfile.inconsistencies) {
      insights.push(makeInsight({
        level: "warning", priority: 4, insightDepth: "diagnostic",
        title: `포트폴리오 일관성 경고: ${issue}`,
        titleSimple: "포트폴리오 구성이 맞지 않는 부분이 있어요",
        description: `${narrativeProfile.label} 프로필이나, ${issue}`,
        descriptionSimple: `포트폴리오 성격(${narrativeProfile.label})과 실제 구성에 어긋나는 부분이 발견됐어요.`,
        relatedIndicator: "narrative", value: narrativeProfile.label,
        valueContext: "포트폴리오 프로필", icon: "🔔",
      }));
    }
  }

  // Null-Safety 필터링
  insights = insights.filter(
    (i) =>
      i.value !== null &&
      i.value !== undefined &&
      i.relatedIndicator !== null &&
      (typeof i.value !== "number" || !isNaN(i.value))
  );

  // 낮은 confidence → alert/warning 억제
  if (detection.confidence < 0.5) {
    insights = insights.filter((i) => i.level === "info" || i.level === "positive");
  }

  const topBanner = buildBanner(insights, config.displayMode);
  const kpiCards = buildKpiCards(detection, calc, insights, config.displayMode);

  // 요약문
  const topInsight = insights[0];
  const summary = topInsight
    ? `${topInsight.titleSimple}. ${topInsight.descriptionSimple}`
    : "현재 특이사항 없이 안정적입니다.";
  const summaryExpert = topInsight
    ? `${topInsight.title}. ${topInsight.description}`
    : "분석 대상 데이터에서 유의미한 이벤트가 감지되지 않았습니다.";

  return {
    config,
    insights,
    marketCrashDetected,
    narrativeProfile,
    topBanner,
    kpiCards,
    summary,
    summaryExpert,
  };
}
