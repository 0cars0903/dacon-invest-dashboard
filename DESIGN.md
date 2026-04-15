# DESIGN.md — InvestLens 디자인 시스템

> InvestLens의 UI/UX 기준을 정의하는 단일 진실 공급원(Single Source of Truth).
> AI에게 UI 구현을 요청할 때 이 파일을 항상 컨텍스트로 제공한다.
> **CLAUDE.md와 함께 모든 UI 작업의 기준 문서다.**

---

## 1. 브랜드 정체성

| 항목 | 내용 |
|------|------|
| 서비스명 | InvestLens |
| 핵심 메시지 | "어떤 투자 데이터든 업로드하면, 자동으로 분석하고 대시보드를 만든다" |
| 톤앤매너 | **전문적이되 진입 장벽이 없는** — 토스증권처럼 초보자도 읽을 수 있는 언어 |
| 키워드 | 신뢰, 자동화, 명료함, 데이터 기반 |
| 포지셔닝 | 복잡한 투자 분석을 누구나 쉽게 |

---

## 2. 색상 팔레트

### 2-1. 코어 색상 (CSS 변수 기준)

| 역할 | Light | Dark | Tailwind 클래스 |
|------|-------|------|----------------|
| Background | `#f9fafb` | `#0f172a` | `bg-gray-50` / `dark:bg-slate-950` |
| Surface (카드) | `#ffffff` | `#1e293b` | `bg-white` / `dark:bg-slate-800` |
| Border | `#e5e7eb` | `#334155` | `border-gray-200` / `dark:border-slate-700` |
| Text Primary | `#111827` | `#f1f5f9` | `text-gray-900` / `dark:text-slate-100` |
| Text Secondary | `#6b7280` | `#94a3b8` | `text-gray-500` / `dark:text-slate-400` |
| Primary (브랜드) | `#6366f1` | `#818cf8` | `bg-indigo-500` / `dark:bg-indigo-400` |
| Primary Hover | `#4f46e5` | `#6366f1` | `hover:bg-indigo-600` |

### 2-2. 투자 데이터 전용 색상 (한국 증시 관례)

> **절대 변경 금지**: 투자 도메인 관례로 사용자가 이미 학습된 색상 의미다.

| 상황 | 색상 | Tailwind | CSS 값 |
|------|------|----------|--------|
| 상승 / 양수 수익률 | 빨강 | `text-red-500` / `bg-red-50` | `#ef4444` |
| 하락 / 음수 수익률 | 파랑 | `text-blue-500` / `bg-blue-50` | `#3b82f6` |
| 보합 / 중립 | 회색 | `text-gray-400` | `#9ca3af` |

### 2-3. 심각도 색상 (인사이트 & 경고)

| 레벨 | 텍스트 | 배경 | 좌측 바 | 용도 |
|------|--------|------|---------|------|
| `alert` | `text-red-700` | `bg-red-50 dark:bg-red-950/30` | `border-l-red-500` | 즉각 주의 필요 |
| `warning` | `text-orange-600` | `bg-orange-50 dark:bg-amber-950/30` | `border-l-amber-500` | 관찰 권고 |
| `info` | `text-sky-600` | `bg-blue-50 dark:bg-blue-950/30` | `border-l-blue-500` | 일반 정보 |
| `positive` | `text-emerald-600` | `bg-emerald-50 dark:bg-emerald-950/30` | `border-l-emerald-500` | 긍정적 신호 |

---

## 3. 타이포그래피

| 용도 | 클래스 | 설명 |
|------|--------|------|
| 페이지 제목 | `text-2xl sm:text-3xl font-bold tracking-tight` | 헤더 서비스명 |
| 섹션 제목 | `text-base font-semibold` | 카드 헤더, 섹션 헤더 |
| **KPI 숫자** | `text-2xl font-bold tabular-nums` | 핵심 수치 — 가장 눈에 띄어야 함 |
| KPI 라벨 | `text-xs text-gray-500 font-medium` | 숫자 위 설명 |
| 본문 | `text-sm` | 일반 텍스트 |
| 보조 텍스트 | `text-xs text-gray-500` | 부제목, 날짜, 단위 |
| 모노스페이스 | `font-mono text-xs` | 데이터 테이블 수치 |

**폰트 패밀리**: `"Pretendard Variable", system-ui, -apple-system, sans-serif`

---

## 4. 컴포넌트 스타일 원칙

### 4-1. 카드 (기본 컨테이너)

```
rounded-xl border border-gray-100 bg-white p-3 shadow-sm
transition-shadow hover:shadow-md
dark:border-slate-700 dark:bg-slate-800
sm:p-4
```

> 모든 대시보드 카드는 위 패턴을 기본으로 한다. 임의 변경 금지.

### 4-2. KPI 카드

```
rounded-xl border bg-white p-3 shadow-sm dark:bg-slate-800
[상태별 border 색상 — 2-3 심각도 체계 적용]
sm:p-4
```

- KPI 숫자는 항상 `text-2xl font-bold tabular-nums` + 상승/하락 색상
- 라벨은 `text-xs text-gray-500 mb-1`
- 서브텍스트(인사이트 요약)는 `text-xs text-gray-400 mt-1 truncate`
- **대시보드당 최대 4개** — 이 이상은 인지 부하를 높임

### 4-3. 버튼

```
Primary: bg-indigo-600 hover:bg-indigo-700 text-white
         rounded-lg px-4 py-2 text-sm font-medium
         transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500

Secondary: bg-gray-100 hover:bg-gray-200 text-gray-700
           dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200
           rounded-lg px-4 py-2 text-sm font-medium

Danger: bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm
```

### 4-4. 탭 (Tab)

```
컨테이너: bg-gray-100 dark:bg-slate-800 rounded-lg p-1
활성 탭:  bg-white dark:bg-slate-700 shadow-sm rounded-md
          text-gray-900 dark:text-white font-medium text-sm
비활성:   text-gray-500 dark:text-gray-400 hover:text-gray-700
          text-sm font-medium
```

### 4-5. 인사이트 카드

```
border-l-4 [레벨별 색상] rounded-r-lg p-3 sm:p-4
[레벨별 배경색]
```

- 좌측 4px 색상 바로 심각도를 즉각 인식
- 아이콘(Lucide) + 메시지 + 전문가/초보자 토글
- 카드 클릭 시 관련 차트 영역으로 스크롤

### 4-6. 차트 카드

```
카드 기본 스타일 적용 +
우상단: "상세 보기 ▼" 토글 버튼 (Level 1↔2 전환)
하단: 데이터 소스 + "InvestLens 자동 생성" 캡션
```

---

## 5. 레이아웃 원칙

### 5-1. 페이지 최대 너비

```
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
```

### 5-2. 그리드 시스템

| 영역 | Mobile | Tablet (sm) | Desktop |
|------|--------|-------------|---------|
| KPI 카드 | 2열 | 4열 | 4열 |
| 차트 그리드 | 1열 | 2열 | 2열 |
| FULL 차트 | 1열 | 1열 (전체 너비) | 1열 |

```
KPI: grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4
차트: grid grid-cols-1 gap-4 sm:grid-cols-2
FULL: col-span-full
```

### 5-3. 여백 체계

| 레벨 | 클래스 | 용도 |
|------|--------|------|
| 섹션 간 | `space-y-5 sm:space-y-6` | 주요 영역 구분 |
| 카드 내부 | `p-3 sm:p-4` | 카드 패딩 |
| 요소 간 | `gap-3 sm:gap-4` | 그리드 갭 |
| 인라인 | `space-x-2` | 아이콘 + 텍스트 |

### 5-4. 정보 위계 (위에서 아래 순서)

```
1. 요약 배너 (1문장 결론)          ← 항상 최상단
2. KPI 카드 (최대 4개)             ← 핵심 수치
3. 차트 그리드 (유형별 자동 배치)   ← 시각적 분석
4. 인사이트 패널 (심각도 정렬)      ← 해석 및 권고
5. 데이터 테이블 (원본 확인)        ← 상세 탐색
```

---

## 6. 상호작용 원칙

| 원칙 | 구현 |
|------|------|
| 전환 애니메이션 | `transition-all duration-300` — 레벨 전환, 탭 전환 |
| 호버 피드백 | `hover:shadow-md` — 카드, `hover:bg-gray-50` — 행 |
| 포커스 상태 | `focus:outline-none focus:ring-2 focus:ring-indigo-500` |
| 로딩 상태 | `animate-pulse` — 스켈레톤 UI |
| 에러 상태 | `border-red-300 bg-red-50` — 인라인 에러 표시 |

---

## 7. 금지 사항 (Lint 연계)

> 아래 사항은 CLAUDE.md Hard Rule과 연동된다.

- `styled-components`, `CSS Modules`, `Emotion` 사용 금지 → Tailwind만 사용
- 인라인 `style={{}}` 사용 금지 (Tailwind 클래스로 대체)
- 상승=파랑, 하락=빨강 색상 배치 금지 (한국 증시 관례 반드시 준수)
- KPI 카드 5개 이상 배치 금지
- 임의 `#hex` 색상 직접 사용 금지 (Tailwind 팔레트 또는 CSS 변수만 사용)
- `Chart.js`, `D3`, `Nivo` 사용 금지 → Recharts만 사용

---

## 8. 레퍼런스

| 항목 | 참고 대상 |
|------|---------|
| 전체 UX 철학 | 토스증권 — 초보자 친화, 용어 순화, 시각 우선 |
| 색상 시스템 | 한국 증시 관례 (상승=빨강, 하락=파랑) |
| 카드 레이아웃 | Linear.app — 미니멀, 정보 밀도 최적화 |
| 차트 스타일 | Recharts 기본 + 커스텀 툴팁 |
| 아이콘 | Lucide React |

---

_Version: 1.0 | 최초 작성: 2026-04-16 | 현재 구현 기반으로 추출_
