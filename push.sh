#!/bin/bash
set -e

cd "$(dirname "$0")"

# 기존 깨진 .git 제거
rm -rf .git

# git 초기화
git init -b main
git add -A
git commit -m "feat: Phase 2 프로토타입 완성 - 파이프라인 4모듈 + 대시보드 UI

- detect.ts: CSV/JSON 파싱, 컬럼역할 패턴매칭, 유형판정
- calculate.ts: 수익률/MA/변동성/MDD/RSI/샤프비율, Base-100 정규화
- insights.ts: 유형별 인사이트, Market Crash Detection, Narrative Profile
- 대시보드 컴포넌트 8종 차트 + 레이아웃
- Skills.md 4모듈 설계 문서
- Lint.md v1.1 Hard Rule H8/H9 추가"

# GitHub remote 설정 + force push (기존 Initial commit 덮어쓰기)
git remote add origin https://github.com/0cars0903/dacon-invest-dashboard.git
git push -u origin main --force

echo ""
echo "✅ GitHub 푸시 완료!"
echo "🔗 https://github.com/0cars0903/dacon-invest-dashboard"

# 스크립트 자체 삭제
rm -- "$0"
