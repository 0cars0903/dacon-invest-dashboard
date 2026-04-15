---
name: DACON 투자데이터스킬대시보드 해커톤 리소스
description: DACON 투자 데이터 스킬 대시보드 해커톤의 대회 링크, Notion 페이지 링크, 폴더 경로, 현재 진행 상황
type: reference
---

## 해커톤 기본 정보
- **대회명**: 투자 데이터 스킬 대시보드 해커톤
- **플랫폼**: DAKER (DACON 팀 빌딩 플랫폼)
- **대회 링크**: https://daker.ai/public/hackathons/hackathon-investment-data-skills-dashboard
- **마감일**: 2026-04-30

## Notion 리소스
- **Skills 메인 페이지**: https://www.notion.so/0cars/Skills-3400654986f28099a157d2b99918c133
  - Page ID: `3400654986f28099a157d2b99918c133`
- **Phase Tracker DB**: https://www.notion.so/65bba5154b924b0fabd28b8228f3809c
  - DB ID: `65bba5154b924b0fabd28b8228f3809c`
  - 스키마: Task(title), Phase(select), Status(status), Date(date), Hours(number), Output(rich_text), Note(rich_text)

## 배포 정보
- **GitHub**: https://github.com/0cars0903/dacon-invest-dashboard (public)
- **Vercel**: https://dacon-invest-dashboard.vercel.app
- Root Directory: `app/`, Next.js preset, GitHub auto-deploy 설정 완료

## 현재 진행 상황 (2026-04-15 기록)
- **Phase 3 진행 중** — 고급 차트+2탭+샘플 데이터+버그 수정 완료, 라이브 테스트 통과
- 최신 커밋: c18e553 (fix: normalizeValue trailing zero 처리)

### 다음 세션 재개 지점
1. **UI 완성도 향상** — 누적수익률 차트 ETF 3종 라인 범례 표시 확인, 다크모드 조정, 반응형
2. **범용성 개선** — Yahoo Finance 실데이터 업로드 테스트, Bollinger Bands
3. **기획서 PDF 작성** — 서비스 개요, Skills.md 설계 방향, 분석 흐름, 스크린샷 포함
4. **Skills.md 최종 보완** — 와이드 포맷 감지 규칙 반영, 제출용 .zip 패키징

### 핵심 아키텍처 참고
- 파이프라인: detect.ts → calculate.ts → insights.ts (순차 실행, H2 규칙)
- 차트 11종: CandlestickChart, PriceLine, CumulativeReturn, Volume, ReturnDistribution, RSI, CorrelationHeatmap, RiskReturnBubble, PortfolioPie, SummaryTable, DataTable
- 2탭: 대시보드 / 데이터 편집 (EditableTable → partial pipeline re-execution)
- Lint.md: Hard Rule + Soft Rule, 코드 수정 전 반드시 확인

## 로컬 폴더 경로
- **작업 폴더**: `/Users/junhee/Desktop/DACON_Monthly_Hackerton/InvestLens`
- **작업 지침**: `.claude/CLAUDE.md`
