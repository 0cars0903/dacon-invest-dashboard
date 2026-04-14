/**
 * 데이터감지규칙 v2.1 구현
 * CSV/JSON → DetectionResult
 */

import Papa from "papaparse";
import type {
  DetectionResult,
  ColumnMeta,
  ColumnRole,
  DataType,
  CustomSubType,
  Frequency,
} from "@/types";

/* ── 0단계: 전처리 ─────────────────────────────── */

function preprocess(raw: string): string {
  // BOM 제거
  let text = raw.replace(/^\uFEFF/, "");
  return text;
}

/* ── 1단계: 파싱 ───────────────────────────────── */

function parseCsv(text: string): Record<string, unknown>[] {
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false, // 문자열 유지 → 1.5단계에서 정규화
  });
  return result.data as Record<string, unknown>[];
}

function parseJson(text: string): Record<string, unknown>[] {
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) return parsed;
  if (parsed.data && Array.isArray(parsed.data)) return parsed.data;
  return [parsed];
}

/* ── 1.5단계: 값 정규화 ────────────────────────── */

function normalizeValue(val: unknown): unknown {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (s === "" || s === "-" || s === "N/A" || s.toLowerCase() === "null")
    return null;

  // 괄호 음수: (5.2) → -5.2
  const parenMatch = s.match(/^\(([0-9.,]+)\)$/);
  if (parenMatch) return -parseFloat(parenMatch[1].replace(/,/g, ""));

  // 백분율: 12.3% → 0.123
  if (s.endsWith("%")) {
    const num = parseFloat(s.slice(0, -1).replace(/,/g, ""));
    return isNaN(num) ? s : num / 100;
  }

  // 화폐 기호 + 콤마 제거
  const cleaned = s.replace(/[$₩€¥£]/g, "").replace(/(\d),(\d)/g, "$1$2");
  const num = parseFloat(cleaned);
  // 숫자 판별: 전체 문자열이 숫자 형식인지 검사 (trailing zero 허용)
  if (!isNaN(num) && /^-?(\d+\.?\d*|\.\d+)$/.test(cleaned))
    return num;

  return s;
}

function normalizeData(
  rows: Record<string, unknown>[]
): Record<string, unknown>[] {
  return rows.map((row) => {
    const normalized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(row)) {
      normalized[key] = normalizeValue(val);
    }
    return normalized;
  });
}

/* ── 2단계: 컬럼 메타 추출 ─────────────────────── */

function extractColumnMeta(
  rows: Record<string, unknown>[],
  colName: string
): Omit<ColumnMeta, "role"> {
  const values = rows.map((r) => r[colName]);
  const nonNull = values.filter((v) => v !== null && v !== undefined);
  const uniqueSet = new Set(nonNull.map(String));

  let dataType: "string" | "number" | "date" = "string";
  const numericCount = nonNull.filter((v) => typeof v === "number").length;
  if (numericCount / Math.max(nonNull.length, 1) > 0.8) dataType = "number";

  return {
    name: colName,
    dataType,
    nullRate: 1 - nonNull.length / Math.max(rows.length, 1),
    uniqueCount: uniqueSet.size,
    sampleValues: nonNull.slice(0, 5),
  };
}

/* ── 3단계: 패턴 매칭 (컬럼 역할 판정) ─────────── */

const PATTERNS: { role: ColumnRole; regex: RegExp }[] = [
  { role: "date", regex: /^(date|trade_?date|trading_?date|timestamp|time|datetime|날짜|일자|거래일)$/i },
  { role: "ohlc", regex: /^(open|high|low|close|adj_?close|시가|고가|저가|종가)$/i },
  { role: "adjusted_price", regex: /^(adj_?close|adjusted_?close|adjusted_?price|수정종가|수정주가)$/i },
  { role: "price", regex: /^(price|value|nav)$/i },
  { role: "volume", regex: /^(volume|vol|거래량|거래대금)$/i },
  { role: "return", regex: /^(return|returns|수익률|daily_return|pct_change)$/i },
  { role: "ticker", regex: /^(ticker|symbol|code|종목코드|종목명|name|asset)$/i },
  { role: "weight", regex: /^(weight|비중|allocation|proportion)$/i },
  { role: "category", regex: /^(category|sector|industry|분류|섹터|자산유형|asset_?class)$/i },
  { role: "currency", regex: /^(currency|통화|ccy|base_?currency)$/i },
  { role: "rating", regex: /^(rating|grade|opinion|recommendation|투자의견|등급|평가)$/i },
];

function matchRole(colName: string, meta: Omit<ColumnMeta, "role">): ColumnRole {
  // 수정주가 우선 매칭 (adjusted_price 패턴이 ohlc보다 먼저)
  for (const { role, regex } of PATTERNS) {
    if (regex.test(colName)) return role;
  }
  if (meta.dataType === "number") return "numeric";
  return "unknown";
}

/* ── Rating 시멘틱 정규화 (§3-9) ────────────────── */

const RATING_MAP: Record<string, number> = {
  "strong buy": 5, "적극 매수": 5, "strongbuy": 5,
  "buy": 4, "매수": 4, "outperform": 4,
  "hold": 3, "보유": 3, "neutral": 3, "중립": 3, "market perform": 3,
  "underperform": 2, "비중 축소": 2, "비중축소": 2,
  "sell": 1, "매도": 1, "strong sell": 1, "적극 매도": 1,
};

function normalizeRating(
  rows: Record<string, unknown>[],
  colName: string
): number[] | undefined {
  const values = rows.map((r) => String(r[colName] ?? "").trim().toLowerCase());
  const mapped = values.map((v) => RATING_MAP[v] ?? NaN);
  // 50% 이상 매핑 성공 시 정규화 적용
  const successRate = mapped.filter((v) => !isNaN(v)).length / Math.max(mapped.length, 1);
  if (successRate < 0.5) return undefined;
  return mapped.map((v) => isNaN(v) ? 3 : v); // 미매핑은 neutral(3)
}

/* ── 날짜 값 검증 ──────────────────────────────── */

const DATE_FORMATS = [
  /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
  /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
  /^\d{8}$/, // YYYYMMDD
  /^\d{4}년\s?\d{1,2}월\s?\d{1,2}일$/, // 한국식
  /^\d{4}\.\d{2}\.\d{2}$/, // YYYY.MM.DD
  /^\d{2}-[A-Za-z]{3}-\d{4}$/, // DD-Mon-YYYY
];

function isDateValue(val: unknown): boolean {
  if (val === null || val === undefined) return false;
  const s = String(val).trim();
  // Unix timestamp
  const num = Number(s);
  if (!isNaN(num) && (num > 1e9 || num > 1e12)) return true;
  return DATE_FORMATS.some((fmt) => fmt.test(s));
}

function validateDateColumn(
  rows: Record<string, unknown>[],
  colName: string
): boolean {
  const sample = rows.slice(0, 20);
  const dateCount = sample.filter((r) => isDateValue(r[colName])).length;
  return dateCount / Math.max(sample.length, 1) > 0.5;
}

/* ── 빈도 감지 ─────────────────────────────────── */

function detectFrequency(
  rows: Record<string, unknown>[],
  dateCol: string
): { frequency: Frequency; tradingDays?: number } {
  const dates = rows
    .map((r) => {
      const v = String(r[dateCol] ?? "").trim();
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    })
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length < 2)
    return { frequency: "irregular" };

  const diffs: number[] = [];
  for (let i = 1; i < Math.min(dates.length, 30); i++) {
    diffs.push(
      (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
    );
  }
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;

  let frequency: Frequency;
  if (avgDiff < 0.01) frequency = "minute";
  else if (avgDiff < 0.5) frequency = "hourly";
  else if (avgDiff < 3) frequency = "daily";
  else if (avgDiff < 10) frequency = "weekly";
  else if (avgDiff < 45) frequency = "monthly";
  else frequency = "irregular";

  return {
    frequency,
    tradingDays: frequency === "daily" ? dates.length : undefined,
  };
}

/* ── 4단계: 유형 판정 ──────────────────────────── */

function determineType(columns: ColumnMeta[]): {
  dataType: DataType;
  subType: CustomSubType | null;
} {
  const has = (role: ColumnRole) => columns.some((c) => c.role === role);
  const count = (role: ColumnRole) => columns.filter((c) => c.role === role).length;
  const tickerCol = columns.find((c) => c.role === "ticker");
  const tickerUnique = tickerCol?.uniqueCount ?? 0;

  // STOCK_TS / ETF_COMP
  if (has("date") && (count("ohlc") >= 2 || has("price") || has("adjusted_price"))) {
    // 와이드 포맷: Date + 2개 이상 price 컬럼 = ETF_COMP
    if (count("price") >= 2) return { dataType: "ETF_COMP", subType: null };
    if (has("ticker") && tickerUnique >= 2) return { dataType: "ETF_COMP", subType: null };
    return { dataType: "STOCK_TS", subType: null };
  }

  // PORT_ALLOC
  if (has("weight") && (has("ticker") || has("category"))) {
    return { dataType: "PORT_ALLOC", subType: null };
  }

  // 수익률 기반
  if (has("date") && has("return")) {
    if (has("ticker") && tickerUnique >= 2) return { dataType: "ETF_COMP", subType: null };
    return { dataType: "STOCK_TS", subType: null };
  }

  // CUSTOM
  const hasDate = has("date");
  const numericCount = columns.filter((c) => c.dataType === "number").length;
  const hasCat = has("category");

  let subType: CustomSubType;
  if (hasDate && numericCount >= 1) subType = "CUSTOM_TS";
  else if (hasCat && numericCount >= 1) subType = "CUSTOM_CAT";
  else if (numericCount >= 2) subType = "CUSTOM_NUM";
  else subType = "CUSTOM_RAW";

  return { dataType: "CUSTOM", subType };
}

/* ── 6단계: 추가 플래그 ────────────────────────── */

function checkLogScale(
  rows: Record<string, unknown>[],
  columns: ColumnMeta[]
): boolean {
  const priceCol = columns.find(
    (c) => c.role === "price" || c.role === "ohlc" || c.role === "adjusted_price"
  );
  if (!priceCol) return false;

  const values = rows
    .map((r) => Number(r[priceCol.name]))
    .filter((v) => !isNaN(v) && v > 0);
  if (values.length < 2) return false;

  const max = Math.max(...values);
  const min = Math.min(...values);
  return max / min > 10;
}

/* ── 메인 detect 함수 ──────────────────────────── */

export function detect(
  rawText: string,
  fileType: "csv" | "json"
): { detection: DetectionResult; parsedData: Record<string, unknown>[] } {
  // 0: 전처리
  const cleaned = preprocess(rawText);

  // 1: 파싱
  const rawRows = fileType === "csv" ? parseCsv(cleaned) : parseJson(cleaned);

  // 1.5: 정규화
  const rows = normalizeData(rawRows);

  if (rows.length === 0) {
    throw new Error("데이터가 비어있습니다.");
  }

  const colNames = Object.keys(rows[0]);

  // 2: 컬럼 메타 추출
  const rawMetas = colNames.map((name) => extractColumnMeta(rows, name));

  // 3: 패턴 매칭
  const columns: ColumnMeta[] = rawMetas.map((meta) => {
    let role = matchRole(meta.name, meta);
    // 날짜 역할이면 값 검증
    if (role === "date" && !validateDateColumn(rows, meta.name)) {
      role = meta.dataType === "number" ? "numeric" : "unknown";
    }
    // Rating 시멘틱 정규화 (§3-9)
    let normalizedValues: number[] | undefined;
    if (role === "rating") {
      normalizedValues = normalizeRating(rows, meta.name);
    }
    return { ...meta, role, normalizedValues };
  });

  // 3.5: 와이드 포맷 ETF/비교 데이터 감지 (Date + 2개 이상 티커형 숫자 컬럼)
  // 예: Date, SPY, QQQ, IWM 또는 Date, 삼성전자, SK하이닉스
  const hasDateCol = columns.some((c) => c.role === "date");
  const numericCols = columns.filter((c) => c.role === "numeric");
  if (hasDateCol && numericCols.length >= 2) {
    // 티커형 컬럼: 영문 대문자 1-6자, 또는 한글 포함 종목명, 또는 숫자가 아닌 이름
    const tickerLikeCols = numericCols.filter((c) => {
      const n = c.name.trim();
      // 영문 티커: 대문자 1-6자 (SPY, QQQ, AAPL 등)
      if (/^[A-Z]{1,6}$/.test(n)) return true;
      // 한글 종목명: 한글 포함 2자 이상
      if (/[가-힣]/.test(n) && n.length >= 2) return true;
      // 영문+숫자 혼합 티커 (BRK.B 등)
      if (/^[A-Z][A-Z0-9.]{0,5}$/.test(n)) return true;
      return false;
    });
    if (tickerLikeCols.length >= 2) {
      // 이 컬럼들을 "price" 역할로 승격하여 ETF_COMP 감지 활성화
      for (const col of tickerLikeCols) {
        const idx = columns.findIndex((c) => c.name === col.name);
        if (idx !== -1) columns[idx] = { ...columns[idx], role: "price" };
      }
    }
  }

  // 4: 유형 판정
  const { dataType, subType } = determineType(columns);

  // 날짜 범위
  const dateCol = columns.find((c) => c.role === "date");
  const dateRange = dateCol
    ? (() => {
        const dates = rows
          .map((r) => String(r[dateCol.name] ?? ""))
          .filter(Boolean)
          .sort();
        const freq = detectFrequency(rows, dateCol.name);
        return {
          start: dates[0],
          end: dates[dates.length - 1],
          ...freq,
        };
      })()
    : undefined;

  // 티커 (한국 6자리 코드 제로패딩 §3-5)
  const tickerCol = columns.find((c) => c.role === "ticker");
  const priceCols = columns.filter((c) => c.role === "price");
  const tickers = tickerCol
    ? [...new Set(rows.map((r) => {
        let val = String(r[tickerCol.name] ?? "").trim();
        // 숫자만으로 구성 + 6자리 미만 → 한국 종목코드 제로패딩
        if (/^\d+$/.test(val) && val.length < 6) {
          val = val.padStart(6, "0");
        }
        return val;
      }).filter(Boolean))]
    : // 와이드 포맷: price 컬럼명 자체가 티커 (SPY, QQQ 등)
      priceCols.length >= 2
      ? priceCols.map((c) => c.name)
      : undefined;

  // 통화
  const currencyCol = columns.find((c) => c.role === "currency");
  const currencies = currencyCol
    ? [...new Set(rows.map((r) => String(r[currencyCol.name] ?? "")).filter(Boolean))]
    : undefined;

  // 수정주가
  const useAdjusted = columns.some((c) => c.role === "adjusted_price");

  // 로그 스케일
  const logScaleRecommended = checkLogScale(rows, columns);

  // 신뢰도
  const knownRoles = columns.filter(
    (c) => c.role !== "unknown" && c.role !== "numeric"
  ).length;
  const confidence = Math.min(knownRoles / Math.max(columns.length, 1), 1);

  const detection: DetectionResult = {
    fileType,
    rowCount: rows.length,
    columnCount: columns.length,
    dataType,
    subType,
    columns,
    tickers,
    currencies,
    useAdjusted,
    logScaleRecommended,
    dateRange,
    confidence,
  };

  return { detection, parsedData: rows };
}
