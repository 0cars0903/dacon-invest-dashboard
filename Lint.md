# Lint.md — InvestLens 코딩 제약사항 관리

> 이 문서는 대시보드 개발 과정에서 발생하는 제약사항과 금지사항을 관리한다.
> **Hard Rule**은 어떤 상황에서도 위반할 수 없으며, **Soft Rule**은 AI의 판단에 위임한다.
> 개발이 진행되면서 새로운 규칙이 지속적으로 추가된다.

---

## Hard Rules (절대 위반 금지)

> AI가 코드를 생성·수정할 때 반드시 준수해야 하는 규칙.
> 위반 시 빌드 실패, 데이터 오류, 또는 평가 감점으로 직결된다.

### H1. 기술 스택 고정

| 항목 | 허용 | 금지 |
|------|------|------|
| 프레임워크 | Next.js 14 (App Router) | Pages Router, CRA, Vite 단독 |
| 스타일링 | Tailwind CSS | CSS Modules, styled-components, Emotion |
| 차트 라이브러리 | Recharts | Chart.js, D3 직접 사용, Nivo |
| CSV 파싱 | Papaparse | csv-parse, 직접 파싱 |
| 배포 | Vercel | Netlify, AWS, 기타 |

- 위 스택 외 라이브러리 추가 시 반드시 사용자 확인을 거칠 것
- `package.json`에 명시되지 않은 의존성을 암묵적으로 추가하지 말 것

### H2. Skills.md 파이프라인 구조 준수

```
데이터감지 → 지표계산 → 시각화매핑 → 인사이트생성
```

- 4개 모듈의 실행 순서를 변경하거나 건너뛰지 말 것
- 각 모듈의 출력 인터페이스(`DetectionResult`, `CalculationResult`, `InsightResult`)를 임의로 변경하지 말 것
- 새 필드 추가 시 Skills.md와 Lint.md 양쪽에 기록할 것

### H3. Fallback 체인 보장

```
어떤 입력이든 → 최소한 테이블 + 기본 통계는 반드시 렌더링
```

- `CUSTOM_RAW` + `fallbackMode: true` 경로가 항상 동작해야 함
- 분석 불가 시 빈 화면, 에러 페이지, 무한 로딩이 발생하면 안 됨
- 모든 차트 컴포넌트에 `try-catch` 또는 React Error Boundary 적용

### H4. 타입 안전성

- TypeScript strict 모드 사용 (`strict: true`)
- `any` 타입 사용 금지 — 불가피한 경우 `unknown` + 타입 가드 사용
- Skills.md의 인터페이스(`DetectionResult`, `CalculationResult`, `Insight`, `InsightResult` 등)를 `types/` 디렉토리에 1:1 대응하는 `.ts` 파일로 정의
- 인터페이스 변경 시 Skills.md → types/ → 컴포넌트 순서로 동기화

### H5. 데이터 무결성

- 사용자 업로드 파일을 원본 그대로 보존, 수정/삭제 금지
- 수치 계산에서 부동소수점 비교 시 `Math.abs(a - b) < epsilon` 사용
- `NaN`, `Infinity`, `null` 값이 차트 데이터에 유입되지 않도록 필터링 필수
- 나눗셈 전 분모 0 체크 필수 (수익률, 샤프비율, 변동성 등)

### H6. 배포 가능 상태 유지

- `main` 브랜치는 항상 `npm run build` 성공 상태
- Vercel 배포 시 빌드 에러가 발생하는 커밋을 push하지 말 것
- 환경 변수가 필요한 기능은 `.env.example`에 명시

### H7. 평가 기준 준수

- 제출물 3종 반드시 생성: 기획서(PDF), Skills.md(.zip), 웹 페이지(배포 URL)
- 대시보드에 "InvestLens" 서비스명 표시
- CSV/JSON 업로드 → 자동 분석 → 대시보드 생성 흐름이 데모 가능해야 함

---

## Soft Rules (AI 판단 위임)

> AI가 상황에 따라 유연하게 판단할 수 있는 영역.
> 최선의 방법을 선택하되, 선택 이유를 주석이나 커밋 메시지로 남길 것.

### S1. 컴포넌트 구조

- 컴포넌트 분리 단위 (파일당 하나 vs 관련 컴포넌트 그룹핑)는 AI가 복잡도에 따라 판단
- `use client` / 서버 컴포넌트 분리 기준은 인터랙션 필요 여부로 AI가 결정
- 커스텀 훅 추출 시점은 재사용성과 가독성을 고려하여 판단

### S2. 스타일링 세부사항

- Tailwind 유틸리티 클래스 조합 방식은 AI 재량
- 반응형 브레이크포인트 세부 조정 (sm/md/lg 경계값)은 상황에 맞게 결정
- 다크 모드 지원 여부 — 시간이 허락하면 추가, 아니면 라이트 모드 전용

### S3. 에러 메시지 문구

- 사용자에게 보여주는 에러/경고 메시지의 톤과 구체적 문구는 AI가 결정
- 단, 기술 용어 노출은 `displayMode` 설정에 따를 것

### S4. 성능 최적화

- `useMemo`, `useCallback`, `React.memo` 적용 범위는 AI가 병목 판단 후 결정
- 데이터 샘플링 (10만 행 초과 시 표시 전략)은 상황에 따라 판단
- 차트 애니메이션 on/off 기준은 데이터 크기와 디바이스 성능 고려

### S5. 코드 스타일

- 변수/함수 네이밍 컨벤션 (camelCase 기본, 한글 주석 허용)
- import 정렬 순서
- 파일/폴더 네이밍 (kebab-case vs camelCase)

### S6. Git 커밋

- 커밋 메시지 형식과 단위는 AI가 작업 맥락에 맞게 결정
- 단, 하나의 커밋에 관련 없는 변경을 섞지 말 것

---

## 개발 중 추가된 규칙 (Changelog)

> Phase 2 이후 개발 과정에서 발견되는 새 규칙을 여기에 누적 기록한다.
> 형식: `[날짜] [H/S][번호] 규칙 내용 — 사유`

```
[2026-04-13] [H8] Skills.md ↔ 코드 1:1 대응 의무 — 대회 심사 환경에서 Skills.md를 기반으로 코드를 평가하므로,
  Skills.md에 정의된 인터페이스·로직·fallback이 코드에 반드시 구현되어야 함.
  발견된 불일치 목록과 수정 내역:
  - [FIXED] Market Crash Detection 미구현 → detectMarketCrash() 추가
  - [FIXED] Narrative Profile 미구현 → buildNarrativeProfile() 추가
  - [FIXED] ETF_COMP 전용 인사이트 미분리 → etfCompInsights() 분리
  - [FIXED] Base-100 정규화 미노출 → calculate.ts ETF_COMP 분기에 구현
  - [FIXED] 한국 티커코드 제로패딩 미처리 → detect.ts에 6자리 패딩 추가
  - [FIXED] Rating 시멘틱 정규화 미구현 → normalizeRating() + RATING_MAP 추가
  - [FIXED] CANDLESTICK 차트: CandlestickChart.tsx 구현 완료 (ComposedChart + Bar 커스텀, OHLC 감지 시 PriceLineChart 대체)
  - [FIXED] ETF_COMP 상관계수 히트맵: CorrelationHeatmap.tsx 구현 완료 (피어슨 상관계수 + 커스텀 셀 그리드)
  - [FIXED] ETF_COMP/PORT_ALLOC 버블차트: RiskReturnBubble.tsx 구현 완료 (ScatterChart + ZAxis)
  - [KNOWN-GAP] Bollinger Bands 선택 지표: Phase 3 후반 구현 예정

[2026-04-13] [H9] 대회 환경 재현성 보장 — Skills.md만으로 동일한 대시보드가 생성 가능해야 함.
  - 파이프라인 각 단계의 입출력 인터페이스가 Skills.md TypeScript 블록과 정확히 일치할 것
  - 기본값(InsightConfig)이 Skills.md에 명시된 값과 동일할 것 (검증 완료)
  - fallback 체인 (CUSTOM → CUSTOM_RAW → fallbackMode → TABLE) 경로가 어떤 데이터에서도 빈 화면 없이 동작할 것

[2026-04-13] [S7] 차트 점진적 확장 전략 — 미구현 차트(CANDLESTICK, HEATMAP, BUBBLE, TREEMAP)는
  ChartGrid에 조건부 렌더링 분기만 두고, 구현 시 해당 분기를 채워넣는 방식으로 확장.
  현재 미구현 차트는 빈 카드 대신 SummaryTable/DataTable로 대체하여 빈 화면 방지.
```

---

---

## UI 리뷰 게이트 체크리스트 (v1.2 신규)

> AI가 UI 컴포넌트를 생성·수정한 후 반드시 이 체크리스트를 통과해야 다음 작업으로 진행한다.
> Soft Rule이지만 체크 항목 3개 이상 미충족 시 Hard Rule 위반으로 간주한다.

```
□ [색상] DESIGN.md §2 색상 팔레트만 사용했는가? (임의 #hex 색상 없음)
□ [스타일] Tailwind CSS 유틸리티 클래스만 사용했는가? (인라인 style={} 없음)
□ [투자색상] 상승=빨강(red-500), 하락=파랑(blue-500) 한국 관례를 준수했는가?
□ [KPI] KPI 카드가 4개 이내로 제한되어 있는가?
□ [반응형] 모바일(1열)과 데스크톱(2~4열) 레이아웃이 모두 정상 동작하는가?
□ [다크모드] 모든 색상에 dark: variant가 적용되어 있는가?
□ [Skills 일치] 새 UI가 시각화매핑규칙.md Level 1~3 체계와 충돌하지 않는가?
```

**체크리스트 사용법:**
- 새 컴포넌트 생성 시: 7개 항목 전체 확인
- 기존 컴포넌트 수정 시: 수정 영역 관련 항목만 확인
- Vercel 배포 전: 7개 항목 전체 재확인

```
[2026-04-16] [S8] DESIGN.md 컨텍스트 의무 제공 — AI에게 UI 작업을 요청할 때
  DESIGN.md를 프롬프트에 함께 제공하거나 "DESIGN.md의 스타일 기준을 따를 것"을 명시할 것.
  누락 시 AI가 임의 스타일을 생성하여 디자인 일관성이 깨질 수 있음.

[2026-04-16] [S9] 리뷰 게이트 통과 확인 — UI 수정 후 반드시 리뷰 게이트 7항목 체크 후
  이상 없으면 Vercel 배포(GitHub push) 진행. 체크리스트 미통과 항목은 즉시 수정.

[2026-04-16] [S10] Sprint C UI 개선 — 5개 파일 수정 완료:
  - [FIXED] COLORS.up/down 한국 관례 역전 → up=#EF4444(빨강), down=#3B82F6(파랑) (visualization.ts)
  - [FIXED] KpiCardGrid inline style={} → Tailwind 클래스 (KpiCardGrid.tsx)
  - [FIXED] TopBannerBar inline style={} → Tailwind 클래스 (TopBannerBar.tsx)
  - [FIXED] KPI 라벨 전문용어 → 일상어 병기 "MDD (최대 낙폭)", "변동성 (가격 흔들림)" 등 (insights.ts)
  - [NEW] InsightPanel Lucide 아이콘 (AlertCircle/AlertTriangle/Info/CheckCircle2)
  - [NEW] InsightPanel expert/simple 토글 버튼
  - [NEW] InsightPanel "나머지 N개 더 보기" 접기 버튼
  - [NEW] lucide-react ^1.8.0 패키지 추가 (package.json)
  - DESIGN.md §2, §4 기준 전면 적용
  - [NOTE] visualization.ts의 hex 값(#EF4444 등)은 Recharts 전용 상수 — 차트 라이브러리는
    Tailwind 클래스를 지원하지 않으므로 hex 필수. 컴포넌트에서는 COLORS.tw 객체의 Tailwind 클래스를 사용할 것.
```

---

_Version: 1.2 | UI 리뷰 게이트 체크리스트 + DESIGN.md 연동 규칙 추가 | 2026-04-16_
