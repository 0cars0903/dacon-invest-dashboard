# 🗓️ 해커톤 참여 계획
> 월간 해커톤 : 투자 데이터를 시각화하라 — Skills 기반 대시보드 설계

## 핵심 정보
| 항목 | 내용 |
|------|------|
| 마감일 | **2026-04-30** |
| 남은 기간 | 15일 (2026-04-15 기준) |
| 현재 Phase | **Phase 3 진행 중** (고급 차트 완료, 2탭 구조 완료, 라이브 테스트 완료) |
| 참여 도구 | Claude Cowork (바이브 코딩) |
| 주중 가용 | 1시간/일 |
| 주말 가용 | 5시간/일 (최대) |

## 총 가용 시간 (예상)
| 기간 | 내용 | 시간 |
|------|------|------|
| 4/12 (일) | 주말 | 5h |
| 4/13–17 (주중) | 평일 × 5 | 5h |
| 4/18–19 (주말) | 주말 × 2 | 10h |
| 4/20–24 (주중) | 평일 × 5 | 5h |
| 4/25–26 (주말) | 주말 × 2 | 10h |
| 4/27–30 (주중) | 평일 × 4 | 4h |
| **합계** | | **39h** |

---

## 제출물
1. **기획서 (PDF)** — 서비스 개요, 분석 흐름, Skills.md 설계 방향
2. **Skills.md (.md / .zip)** — 투자 분석 규칙 정의 문서
3. **웹 페이지 (배포 URL)** — 바이브 코딩 기반 투자 대시보드

## 평가 기준 (배점 우선순위)
| 항목 | 배점 | 전략 |
|------|------|------|
| 범용성 | 25점 | 다양한 투자 데이터 구조 대응 가능한 Skills.md |
| Skills.md 설계 | 25점 | 분석 규칙·시각화 기준·인사이트 규칙 명확히 |
| 대시보드 자동 생성 | 25점 | Skills.md → 자동 시각화 파이프라인 구현 |
| 바이브코딩 활용 | 15점 | Claude Cowork로 문서 기반 생성 구조 |
| 실용성 및 창의성 | 10점 | UX 개선, 확장 기능 |

---

## 단계별 계획

### ✅ Phase 1 — 기획 + Skills.md 설계 (4/12~4/14 · 7h) **[완료]**
**목표**: 서비스 컨셉 확정, Skills.md 초안 완성

| 날짜 | 활동 | 시간 | 상태 |
|------|------|------|------|
| 4/12 (일) | 대회 분석, 서비스 컨셉 결정, 데이터 소스 조사 | 3h | ✅ |
| 4/12 (일) | Skills.md 구조 초안 설계 (분석 규칙, 시각화 기준) | 2h | ✅ |
| 4/13 (월) | Skills.md 세부 작성 (투자 지표 계산 규칙) | 1h | ✅ |
| 4/14 (화) | Skills.md 세부 작성 (인사이트 생성 규칙) | 1h | ✅ |

**성과**:
- 서비스 컨셉 "InvestLens" 확정
- Skills.md 4모듈 v2.1 완성 (데이터감지/지표계산/시각화매핑/인사이트생성)
- 6개 페르소나 정의 (personas.md)

---

### ✅ Phase 2 — 프로토타입 개발 (4/12~4/13 · 선행 완료) **[완료]**
**목표**: Next.js 프로젝트 세팅 + 핵심 컴포넌트 구현

| 날짜 | 활동 | 시간 | 상태 |
|------|------|------|------|
| 4/12 (일) | Next.js 16 프로젝트 세팅 + 타입 정의 | 2h | ✅ |
| 4/12 (일) | 파이프라인 4모듈 구현 (detect/calculate/insights) | 3h | ✅ |
| 4/13 (월) | 대시보드 UI 8종 차트 + 레이아웃 구현 | 2h | ✅ |
| 4/13 (월) | Skills.md ↔ 코드 감사 (CRITICAL 6건 수정) | 2h | ✅ |
| 4/13 (월) | GitHub 레포 생성 + Vercel 배포 완료 | 1h | ✅ |

**성과**:
- 파이프라인: detect.ts → calculate.ts → insights.ts → index.ts
- 차트 8종: PriceLine, CumulativeReturn, Volume, ReturnDistribution, RSI, PortfolioPie, SummaryTable, DataTable
- Skills.md ↔ 코드 감사: CRITICAL 6건 수정, Lint.md v1.1 (H8/H9/S7 추가)
- TypeScript strict 0 errors
- GitHub: https://github.com/0cars0903/dacon-invest-dashboard
- Vercel: https://dacon-invest-dashboard.vercel.app

---

### 🚀 Phase 3 — 기능 완성 + 고도화 (4/14~4/26 · 15h)
**목표**: 고급 차트 추가, UI 개선, 기획서 PDF 작성

| 날짜 | 활동 | 시간 | 상태 |
|------|------|------|------|
| 4/14~15 | 고급 차트 구현 (CANDLESTICK, HEATMAP, BUBBLE) | 4h | ✅ |
| 4/14~15 | 2탭 구조 + 샘플 데이터 + 차트 선택 이유 배너 | 4h | ✅ |
| 4/15 | 와이드 포맷 ETF 감지 + normalizeValue 버그 수정 | 1h | ✅ |
| 4/15 | 3개 샘플 데이터 라이브 테스트 (STOCK/ETF/PORT) | 1h | ✅ |
| 4/16~19 | UI 완성도 향상 + 범용성 개선 + 버그 수정 | 3h | ✅ |
| 4/20~22 | 기획서 작성 (PDF) | 2h | 🔲 |
| 4/23~26 | Skills.md 최종 보완 + 제출물 패키징 (.zip) | 2h | 🔲 |

**KNOWN-GAP**:
- ~~CANDLESTICK 차트~~ [FIXED 4/15]
- ~~ETF_COMP 상관계수 히트맵 / 버블차트~~ [FIXED 4/15]
- ~~와이드 포맷 ETF 감지 실패~~ [FIXED 4/15]
- ~~normalizeValue trailing zero 변환 실패~~ [FIXED 4/15]
- Bollinger Bands 선택 지표 (미구현)
- ~~누적수익률 차트에 ETF 3종 라인이 1개만 표시~~ [FIXED 4/15 — ETFMultiLineChart 컴포넌트 분리, Base-100 멀티라인 + 범례]
- ~~다크모드 미구현~~ [FIXED 4/15 — 전체 21개 컴포넌트 dark: variant 적용]
- ~~반응형 레이아웃 미흡~~ [FIXED 4/15 — sm: breakpoint 반응형 적용]
- Bollinger Bands 선택 지표 (미구현)

**Claude Cowork 활용**:
- `code-refactor` 스킬로 코드 품질 향상
- Vercel 자동 배포 (GitHub push → auto-deploy)

---

### ✅ Phase 4 — 최종 점검 + 제출 (4/27~4/30 · 4h)
**목표**: 제출 완료

| 날짜 | 활동 | 시간 |
|------|------|------|
| 4/27 (월) | 전체 점검 (기능, UI, 링크) | 1h |
| 4/28 (화) | 기획서 최종 수정 | 1h |
| 4/29 (수) | 배포 URL 최종 확인, GitHub 정리 | 1h |
| 4/30 (목) | **최종 제출** | 1h |

---

## 기술 스택 (제안)
| 구분 | 기술 |
|------|------|
| Frontend | Next.js 16.2.3 (App Router) + Tailwind CSS v4 |
| 차트 | Recharts 3.8.1 |
| CSV 파싱 | Papaparse 5.5.3 |
| 데이터 | CSV/JSON 업로드 → 자동 감지 (Yahoo Finance, FRED 포맷 지원) |
| 배포 | Vercel (GitHub auto-deploy) |
| 스킬 기반 | Skills.md → Claude Cowork 자동 생성 |

---

## Skills.md 설계 방향 (초안)
- `투자데이터_분석규칙.md` — 데이터 전처리, 지표 계산 규칙
- `시각화_선택기준.md` — 데이터 유형별 차트 선택 가이드
- `인사이트_생성규칙.md` — 자동 인사이트 문구 생성 규칙
- `대시보드_구성규칙.md` — 레이아웃, 카드 구성, 우선순위

---

---

## 배포 정보
| 항목 | URL |
|------|-----|
| GitHub | https://github.com/0cars0903/dacon-invest-dashboard |
| Vercel (Production) | https://dacon-invest-dashboard.vercel.app |
| Vercel (Team) | junhees-projects-5f5f2302 |

---

## 다음 세션 재개 지점 (2026-04-15 업데이트)

### 완료된 작업 (4/15 세션)
- ETF 누적수익률 멀티라인 차트 수정 (ETFMultiLineChart, Base-100, 범례)
- 전체 21개 컴포넌트 다크모드 적용 (dark: variant)
- 반응형 레이아웃 개선 (sm: breakpoint)
- UI 디테일 (헤더 로고, 푸터, 탭 스타일, 호버 효과)
- Vercel 배포 완료 (commit c2b5772)

### 다음 작업 (Phase 3 나머지)
1. **기획서 작성 (PDF)** — 서비스 개요, Skills.md 설계 방향, 분석 흐름, 스크린샷 포함 (4/20~22)
2. **Skills.md 최종 보완** — 와이드 포맷 감지 규칙 반영, 제출용 .zip 패키징 (4/23~26)

### 커밋 히스토리
- c2b5772: fix: CumulativeReturnChart Tooltip formatter 타입 에러 수정
- c18e553: fix: normalizeValue trailing zero 처리
- 4b89a42: fix: 와이드 포맷 ETF 데이터 감지 지원
- 6fb9ef6: feat: 고급 차트 3종 구현 (캔들스틱, 상관계수 히트맵, 위험-수익 버블)
- 96839f7: feat: 자동생성 체감도 강화 + 샘플 데이터 + 2탭 동기화 구현

_최종 업데이트: 2026-04-15_
