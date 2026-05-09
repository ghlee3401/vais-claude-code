---
owner: cpo
artifact: main
phase: plan
feature: vais-positioning-rethink
---

# vais-positioning-rethink — Plan 인덱스

## Executive Summary

vais-code 의 v0.66 본 sprint scope 를 *제품 기획 시각* 으로 정의. CEO ideation 에서 도출된 정체성 ("부서장 매뉴얼 organization-in-a-box") + 로드맵 v2 (M0+M1 → Target-app 부분 → ...) 을 기반으로 — Plan phase 는 기회 → 부재 갭 → M0+M1 spec → 사용자 페르소나 → 성공 기준의 인과 사슬을 박제. PRD (Do phase) 작성 전 합의 단계.

## Decision Record

| Date | Decision | Owner | Source |
|------|----------|-------|--------|
| 2026-05-09 | v0.66 핵심 기회 = "PO 가 부서장 역할을 할 때 부족한 다학제 도메인 지식·운영 매뉴얼·의사결정 패턴" 의 박제 (CEO ideation 정체성 인용) | CPO (plan) | plan-rationale §1 |
| 2026-05-09 | v0.66 sprint scope = M0 (Ideation Continuity) + M1 Tier-1 6 개. M0 인프라 박힌 후 M1 콘텐츠 박제 (self-application 검증) | CPO (plan) | plan-rationale §2 |
| 2026-05-09 | 1 차 사용자 페르소나 = "1 PO 본인" (dogfood 우선). 2 차 페르소나 = "외부 1 PO/founder" (v0.67 Target-app Bootstrap 부분 후 유입). 팀/기업 페르소나는 v0.70+ | CPO (plan) | plan-rationale §3 |
| 2026-05-09 | M0 성공 기준 = (a) 세션 종료/재개 후 5 분 내 컨텍스트 회복 (b) commit 시 ideation 자동 박제 (c) 사용자 명시 부담 0. M1 성공 기준 = (d) dogfood 시 vanilla CC plan 대비 차별화 입증 (e) 6 개 framework 모두 OJT 깊이 충족 (4 요소: framework + 실무단계 + 의사결정패턴 + 산출물양식) | CPO (plan) | plan-rationale §4 |
| 2026-05-09 | Plan phase 완성도 자가 점검 = 80% (5 핵심 항목: 기회/범위/페르소나/성공기준/리스크 모두 명시). PRD 8 섹션 (Do phase) 진입 가능 | CPO (plan) | plan-rationale §5 |

## Artifacts

| File | Type | Description |
|------|------|-------------|
| `01-plan/main.md` | 인덱스 | 본 문서 |
| `01-plan/plan-rationale.md` | 분석 | 기회 / 범위 / 페르소나 / 성공 기준 / 리스크 통합 |

## CEO 판단 근거

본 phase 진입은 CEO ideation (turn 1~9) 의 명시적 권장 (`/vais cpo plan vais-positioning-rethink`) 에 따름. CEO 7 차원 알고리즘 호출은 ideation 모드 예외로 우회됨. CPO 활성화 근거 = ideation 결정 (Decision Record): "v0.66 = M0 + M1 박제 → PRD 로 spec 구체화 필요". 의존성 충족 (CPO 는 의존 없음 — CTO 보다 우선 가능).

## Next Phase

### 권장 다음 단계: **CPO design** 또는 **CPO do (PRD 합성)**

CPO PDCA 에서 design phase 는 선택 (`02-design/main.md`). plan-rationale 가 충분히 분석을 담았다면 design 생략 가능 → 바로 do (prd-writer) 로 진입.

| 옵션 | 비고 |
|------|------|
| `/vais cpo design vais-positioning-rethink` | product-discoverer (OST) + product-strategist (VPC) + product-researcher (TAM) 병렬. 단, vais-code 는 *내부 도구* 라 TAM/경쟁사 분석 의미 약함 — design 생략 후보 |
| `/vais cpo do vais-positioning-rethink` | prd-writer 호출 → PRD 8 섹션 합성. plan-rationale + ideation 박제로 충분 |

**CPO 추천**: `do` 직행. design 은 vais-code 내부 도구 특성 상 over-engineering. plan-rationale §5 의 5 항목이 PRD 입력으로 충분.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-09 | 초기 작성 — ideation 박제 후 plan phase 진입. 5 Decision Record + plan-rationale.md 1 artifact |
