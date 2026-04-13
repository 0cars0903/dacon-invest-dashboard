/**
 * 지표계산규칙 v2.1 구현
 * DetectionResult → CalculationResult
 */

import type {
  DetectionResult,
  CalculationResult,
  Indicator,
  Anomaly,
  CrossoverEvent,
  NormalizedPrice,
  CalculationSummary,
} from "@/types";
import { MA_PERIODS } from "@/constants/defaults";

/* ── 유틸리티 ──────────────────────────────────── */

function safeDiv(a: number, b: number): number {
  if (b === 0 || !isFinite(b)) return 0;
  return a / b;
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function std(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

/** 가격 컬럼 값 추출 (수정주가 우선) */
function getPrices(
  rows: Record<string, unknown>[],
  detection: DetectionResult
): number[] {
  const priceCol = detection.useAdjusted
    ? detection.columns.find((c) => c.role === "adjusted_price")
    : null;
  const fallbackCol =
    detection.columns.find((c) => c.role === "ohlc" && /close|종가/i.test(c.name)) ??
    detection.columns.find((c) => c.role === "price") ??
    detection.columns.find((c) => c.role === "ohlc");

  const col = priceCol ?? fallbackCol;
  if (!col) return [];
  return rows.map((r) => Number(r[col.name])).filter((v) => !isNaN(v));
}

function getDates(
  rows: Record<string, unknown>[],
  detection: DetectionResult
): string[] {
  const dateCol = detection.columns.find((c) => c.role === "date");
  if (!dateCol) return [];
  return rows.map((r) => String(r[dateCol.name] ?? ""));
}

/* ── 이상치 감지 ───────────────────────────────── */

function detectAnomalies(
  prices: number[],
  dates: string[]
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] <= 0) {
      anomalies.push({
        date: dates[i] ?? `row_${i}`,
        type: "price_error",
        value: prices[i],
        description: `가격이 0 또는 음수 (${prices[i]})`,
      });
      continue;
    }
    const ret = safeDiv(prices[i] - prices[i - 1], prices[i - 1]);
    if (ret < -0.5) {
      anomalies.push({
        date: dates[i] ?? `row_${i}`,
        type: "split_suspect",
        value: ret * 100,
        description: `일간 수익률 ${(ret * 100).toFixed(1)}% — 액면분할/병합 의심`,
      });
    } else if (ret > 1.0) {
      anomalies.push({
        date: dates[i] ?? `row_${i}`,
        type: "split_suspect",
        value: ret * 100,
        description: `일간 수익률 +${(ret * 100).toFixed(1)}% — 액면분할/병합 의심`,
      });
    }
  }

  // 연속 동일 가격 감지
  let streak = 1;
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] === prices[i - 1]) {
      streak++;
      if (streak === 5) {
        anomalies.push({
          date: dates[i - 4] ?? `row_${i - 4}`,
          type: "halt_suspect",
          value: streak,
          description: `${streak}일 이상 동일 가격 — 거래 정지 의심`,
        });
      }
    } else {
      streak = 1;
    }
  }

  return anomalies;
}

/* ── 지표 계산 함수들 ──────────────────────────── */

function calcReturns(prices: number[]): number[] {
  return prices.slice(1).map((p, i) => safeDiv(p - prices[i], prices[i]));
}

function calcCumulativeReturn(prices: number[]): number[] {
  if (prices.length === 0) return [];
  const p0 = prices[0];
  return prices.map((p) => safeDiv(p - p0, p0));
}

function calcMA(prices: number[], period: number): (number | null)[] {
  return prices.map((_, i) => {
    if (i < period - 1) return null;
    const slice = prices.slice(i - period + 1, i + 1);
    return mean(slice);
  });
}

function calcMDD(prices: number[]): { mdd: number; start: number; end: number } {
  let peak = prices[0];
  let mdd = 0;
  let mddEnd = 0;
  let mddStart = 0;
  let peakIdx = 0;

  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > peak) {
      peak = prices[i];
      peakIdx = i;
    }
    const dd = safeDiv(prices[i] - peak, peak);
    if (dd < mdd) {
      mdd = dd;
      mddEnd = i;
      mddStart = peakIdx;
    }
  }
  return { mdd, start: mddStart, end: mddEnd };
}

function calcRSI(returns: number[], period: number = 14): number | null {
  if (returns.length < period) return null;
  const recent = returns.slice(-period);
  const gains = recent.filter((r) => r > 0);
  const losses = recent.filter((r) => r < 0).map((r) => Math.abs(r));
  const avgGain = gains.length > 0 ? mean(gains) : 0;
  const avgLoss = losses.length > 0 ? mean(losses) : 0;
  if (avgLoss === 0) return 100;
  const rs = safeDiv(avgGain, avgLoss);
  return 100 - 100 / (1 + rs);
}

function calcSharpe(
  returns: number[],
  riskFreeRate: number = 0.035,
  annualFactor: number = Math.sqrt(252)
): number {
  const avgReturn = mean(returns);
  const stdReturn = std(returns);
  const dailyRf = riskFreeRate / 252;
  return safeDiv((avgReturn - dailyRf) * annualFactor, stdReturn * annualFactor);
}

function getAnnualFactor(detection: DetectionResult): number {
  const freq = detection.dateRange?.frequency ?? "daily";
  const td = detection.dateRange?.tradingDays;
  switch (freq) {
    case "minute": return Math.sqrt((td ?? 252) * 390);
    case "hourly": return Math.sqrt((td ?? 252) * 6.5);
    case "daily": return Math.sqrt(td ?? 252);
    case "weekly": return Math.sqrt(52);
    case "monthly": return Math.sqrt(12);
    default: return Math.sqrt(252);
  }
}

/* ── 골든/데드크로스 감지 ──────────────────────── */

function detectCrossovers(
  prices: number[],
  dates: string[],
  volumes: number[] | null,
  shortPeriod: number,
  longPeriod: number
): CrossoverEvent[] {
  if (prices.length < longPeriod + 5) return [];
  const maShort = calcMA(prices, shortPeriod);
  const maLong = calcMA(prices, longPeriod);
  const events: CrossoverEvent[] = [];
  const avgVol20 = volumes && volumes.length >= 20
    ? mean(volumes.slice(-20))
    : null;

  for (let i = longPeriod; i < prices.length; i++) {
    const s = maShort[i];
    const l = maLong[i];
    const sPrev = maShort[i - 1];
    const lPrev = maLong[i - 1];
    if (s === null || l === null || sPrev === null || lPrev === null) continue;

    const buffer = l * 0.0001;
    if (sPrev <= lPrev && s > l + buffer) {
      const volConfirmed = volumes && avgVol20
        ? volumes[i] > avgVol20 * 1.2
        : false;
      events.push({ date: dates[i], type: "golden", volumeConfirmed: volConfirmed });
    } else if (sPrev >= lPrev && s < l - buffer) {
      const volConfirmed = volumes && avgVol20
        ? volumes[i] > avgVol20 * 1.2
        : false;
      events.push({ date: dates[i], type: "dead", volumeConfirmed: volConfirmed });
    }
  }
  return events;
}

/* ── 메인 calculate 함수 ───────────────────────── */

export function calculate(
  detection: DetectionResult,
  rows: Record<string, unknown>[]
): CalculationResult {
  const indicators: Indicator[] = [];
  const prices = getPrices(rows, detection);
  const dates = getDates(rows, detection);
  const annualFactor = getAnnualFactor(detection);

  // Fallback 체크
  if (prices.length < 2 && detection.dataType !== "PORT_ALLOC") {
    return {
      dataType: detection.dataType,
      fallbackMode: true,
      anomalies: [],
      indicators: [],
      summary: { totalReturn: 0, annualizedReturn: 0, volatility: 0, mdd: 0 },
    };
  }

  const anomalies = prices.length >= 2 ? detectAnomalies(prices, dates) : [];
  const returns = prices.length >= 2 ? calcReturns(prices) : [];
  let crossoverEvents: CrossoverEvent[] | undefined;
  let normalizedPrices: NormalizedPrice[] | undefined;

  const freq = detection.dateRange?.frequency ?? "daily";
  const periods = MA_PERIODS[freq as keyof typeof MA_PERIODS] ?? MA_PERIODS.daily;

  // ── STOCK_TS / ETF_COMP 공통 지표 ──
  if (
    detection.dataType === "STOCK_TS" ||
    detection.dataType === "ETF_COMP"
  ) {
    // 일간 수익률
    if (returns.length > 0) {
      indicators.push({
        id: "daily_return",
        name: "일간 수익률",
        category: "required",
        value: returns[returns.length - 1],
        unit: "%",
        timeSeries: { dates: dates.slice(1), values: returns },
        metadata: { nullCount: 0 },
      });
    }

    // 누적 수익률
    const cumReturns = calcCumulativeReturn(prices);
    indicators.push({
      id: "cumulative_return",
      name: "누적 수익률",
      category: "required",
      value: cumReturns[cumReturns.length - 1] ?? 0,
      unit: "%",
      timeSeries: { dates, values: cumReturns },
      metadata: { nullCount: 0 },
    });

    // 이동평균
    for (const [label, period] of [
      ["단기", periods.short],
      ["중기", periods.mid],
      ["장기", periods.long],
    ] as const) {
      if (prices.length >= period) {
        const ma = calcMA(prices, period);
        indicators.push({
          id: `ma_${period}`,
          name: `이동평균 (${period})`,
          category: "required",
          value: ma[ma.length - 1] ?? 0,
          unit: "$",
          timeSeries: {
            dates,
            values: ma.map((v) => v ?? 0),
          },
          metadata: { period: `${period}${label}`, nullCount: 0 },
        });
      }
    }

    // 변동성
    if (returns.length > 0) {
      const vol = std(returns) * annualFactor;
      indicators.push({
        id: "volatility",
        name: "변동성 (연환산)",
        category: "required",
        value: vol,
        unit: "%",
        metadata: { nullCount: 0 },
      });
    }

    // MDD
    if (prices.length >= 2) {
      const mddResult = calcMDD(prices);
      indicators.push({
        id: "mdd",
        name: "최대 낙폭 (MDD)",
        category: "required",
        value: mddResult.mdd,
        unit: "%",
        metadata: {
          period: `${dates[mddResult.start] ?? ""} ~ ${dates[mddResult.end] ?? ""}`,
          nullCount: 0,
        },
      });
    }

    // RSI (선택)
    const rsi = calcRSI(returns);
    if (rsi !== null) {
      indicators.push({
        id: "rsi",
        name: "RSI (14)",
        category: "optional",
        value: rsi,
        unit: "index",
        metadata: { period: "14일", nullCount: 0 },
      });
    }

    // 샤프비율
    if (returns.length >= 20) {
      const sharpe = calcSharpe(returns, 0.035, annualFactor);
      indicators.push({
        id: "sharpe_ratio",
        name: "샤프 비율",
        category: "required",
        value: sharpe,
        unit: "ratio",
        metadata: { nullCount: 0 },
      });
    }

    // 골든/데드크로스
    const volCol = detection.columns.find((c) => c.role === "volume");
    const volumes = volCol
      ? rows.map((r) => Number(r[volCol.name])).filter((v) => !isNaN(v))
      : null;
    crossoverEvents = detectCrossovers(
      prices,
      dates,
      volumes,
      periods.short,
      periods.mid
    );

    // ── ETF_COMP: Base-100 정규화 (§3-0) ──
    if (detection.dataType === "ETF_COMP" && detection.tickers && detection.tickers.length > 0) {
      const priceCol =
        detection.columns.find((c) => c.role === "ohlc" && /close|종가/i.test(c.name)) ??
        detection.columns.find((c) => c.role === "price") ??
        detection.columns.find((c) => c.role === "ohlc");
      const tickerCol = detection.columns.find((c) => c.role === "ticker");
      const dateCol = detection.columns.find((c) => c.role === "date");

      if (priceCol && tickerCol && dateCol) {
        normalizedPrices = detection.tickers.map((ticker) => {
          const tickerRows = rows.filter(
            (r) => String(r[tickerCol.name]) === ticker
          );
          const tickerDates = tickerRows.map((r) => String(r[dateCol.name] ?? ""));
          const tickerPrices = tickerRows.map((r) => Number(r[priceCol.name]) || 0);
          const base = tickerPrices[0] || 1;
          return {
            ticker,
            dates: tickerDates,
            values: tickerPrices.map((p) => (p / base) * 100),
          };
        });
      }
    }
  }

  // ── PORT_ALLOC 지표 ──
  if (detection.dataType === "PORT_ALLOC") {
    const weightCol = detection.columns.find((c) => c.role === "weight");
    const returnCol = detection.columns.find((c) => c.role === "return");
    const catCol = detection.columns.find((c) => c.role === "category");

    if (weightCol) {
      const weights = rows.map((r) => Number(r[weightCol.name]) || 0);
      const weightSum = weights.reduce((a, b) => a + b, 0);
      // 정규화
      const normWeights = weightSum > 0
        ? weights.map((w) => w / weightSum)
        : weights;

      // 가중 수익률
      if (returnCol) {
        const rets = rows.map((r) => Number(r[returnCol.name]) || 0);
        const weightedReturn = normWeights.reduce(
          (s, w, i) => s + w * rets[i],
          0
        );
        indicators.push({
          id: "weighted_return",
          name: "가중 수익률",
          category: "required",
          value: weightedReturn,
          unit: "%",
          metadata: { nullCount: 0 },
        });
      }

      // HHI
      if (catCol) {
        const catWeights: Record<string, number> = {};
        rows.forEach((r, i) => {
          const cat = String(r[catCol.name] ?? "기타");
          catWeights[cat] = (catWeights[cat] ?? 0) + normWeights[i];
        });
        const hhi = Object.values(catWeights).reduce((s, w) => s + w * w, 0);
        indicators.push({
          id: "hhi",
          name: "집중도 (HHI)",
          category: "required",
          value: hhi,
          unit: "ratio",
          metadata: { nullCount: 0 },
        });
      }
    }
  }

  // Summary
  const totalReturn =
    indicators.find((i) => i.id === "cumulative_return")?.value ??
    indicators.find((i) => i.id === "weighted_return")?.value ??
    0;
  const vol =
    (indicators.find((i) => i.id === "volatility")?.value as number) ?? 0;
  const mdd =
    (indicators.find((i) => i.id === "mdd")?.value as number) ?? 0;
  const sharpe =
    (indicators.find((i) => i.id === "sharpe_ratio")?.value as number) ??
    undefined;

  const summary: CalculationSummary = {
    totalReturn: typeof totalReturn === "number" ? totalReturn : 0,
    annualizedReturn: typeof totalReturn === "number" ? totalReturn : 0,
    volatility: vol,
    sharpeRatio: sharpe,
    mdd,
  };

  return {
    dataType: detection.dataType,
    fallbackMode: false,
    anomalies,
    indicators,
    crossoverEvents,
    normalizedPrices,
    summary,
  };
}
