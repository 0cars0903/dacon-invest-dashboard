/**
 * 데이터감지규칙 v2.1 — DetectionResult 인터페이스
 * Skills.md Module 1/4 대응
 */

export type DataType = 'STOCK_TS' | 'ETF_COMP' | 'PORT_ALLOC' | 'CUSTOM';

export type CustomSubType =
  | 'CUSTOM_TS'
  | 'CUSTOM_CAT'
  | 'CUSTOM_NUM'
  | 'CUSTOM_RAW';

export type ColumnRole =
  | 'date'
  | 'price'
  | 'ohlc'
  | 'volume'
  | 'return'
  | 'ticker'
  | 'weight'
  | 'category'
  | 'currency'
  | 'rating'
  | 'adjusted_price'
  | 'numeric'
  | 'unknown';

export type Frequency =
  | 'minute'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'irregular';

export interface ColumnMeta {
  name: string;
  role: ColumnRole;
  dataType: 'string' | 'number' | 'date';
  nullRate: number; // 0~1
  uniqueCount: number;
  sampleValues: unknown[]; // 처음 5개 값
  normalizedValues?: number[]; // 평가등급 시멘틱 정규화 결과
}

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;
  frequency: Frequency;
  tradingDays?: number; // 실제 거래일 수
}

export interface DetectionResult {
  fileType: 'csv' | 'json';
  rowCount: number;
  columnCount: number;
  dataType: DataType;
  subType: CustomSubType | null; // CUSTOM이면 non-null
  columns: ColumnMeta[];
  tickers?: string[];
  currencies?: string[]; // ISO 4217
  useAdjusted: boolean; // 수정주가 컬럼 존재 시 true
  logScaleRecommended: boolean; // 가격 범위 비율 > 10× 시 true
  dateRange?: DateRange;
  confidence: number; // 0~1
}
