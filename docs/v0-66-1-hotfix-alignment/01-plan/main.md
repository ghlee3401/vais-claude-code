---
owner: cto
artifact: main
phase: plan
feature: v0-66-1-hotfix-alignment
---

# v0-66-1-hotfix-alignment — Plan 인덱스

## Executive Summary

3 모델 (Codex / Claude / Gemini) cross-model 분석 (`docs/multimodel-repo-analysis/`) 에서 합의된 **P0 3 항** (α `analyzeCEO` 인터페이스 / β 버전 메타 / γ session-start 명령 안내) 을 v0.66.1 hotfix 1 PR 로 묶어 ~85 분 안에 release 한다. CEO 의 7 차원 라우팅 (vais-code 정체성) 이 깨진 상태를 우선 봉합하고, P1/P2 는 v0.66.2 / v0.67 에서 별도 처리. v0.66.0 GA tag 는 rollback 하지 않고 유지.

## Decision Record

| Date | Decision | Owner | Source |
|------|----------|-------|--------|
| 2026-05-12 | v0.66.1 = P0 3 항만 (P1/P2 분리) | CTO (plan) | tech-plan §1, §2 |
| 2026-05-12 | P0-α 수정 = **Gemini hotfix 라인 (`rawText \|\| input`) + Claude 회귀 테스트 동시 적용**. 문서 (`agents/ceo/ceo.md`) 는 `rawText` 정본으로 정정 | CTO (plan) | tech-plan §1 α-1/2/3 + synthesis §3.2 |
| 2026-05-12 | 회귀 테스트 신설 = `tests/ceo-algorithm.test.js` 4 케이스 (rawText 정본 / input 알리아스 / 7 차원 등급 산출 / activeCLevel 매핑). `gradeAtLeast` 로 단조성 검증해 휴리스틱 변경에 brittle 하지 않게 작성 | CTO (plan) | tech-plan §5 리스크 4 완화 |
| 2026-05-12 | 작업 sequence = 9 step (α 3 + β 5 + γ 1). 통합 검증 = npm test + lint + vais-validate-plugin + 수동 dogfood 1 회 | CTO (plan) | tech-plan §3, §6 |
| 2026-05-12 | AC 9 개 — α 검증 2 (AC-1/2) + 버전 메타 3 (AC-3/4/5) + session-start 1 (AC-6) + CI 3 (AC-7/8/9) | CTO (plan) | tech-plan §4 |
| 2026-05-12 | 총 추정 = 85 분 (≈1.5 시간). 단일 PR | CTO (plan) | tech-plan §7 |
| 2026-05-12 | CP-0 분기 = "missing" 이지만 synthesis.md 가 PRD 등가 컨텍스트로 충분 → 강행 모드 (CP-0 발동 우회). 사용자 옵션 A 승인 = 명시적 강행 | CTO (plan) | synthesis §5 옵션 A 사용자 선택 |
| 2026-05-12 | 템플릿 자동 선택 = plan-standard (변경 surface 약 10 파일 + 단일 도메인 "정렬") | CTO (plan) | cto.md "Plan phase Template 자동 선택" |

## Artifacts

| File | Type | Description |
|------|------|-------------|
| `01-plan/main.md` | 인덱스 | 본 문서 |
| `01-plan/tech-plan.md` | 기술 계획 (CTO) | In-scope 9 변경 + 작업 sequence 9 step + AC 9 + 리스크 5 + 시간 추정 85 분 |

## CEO 판단 근거

CEO ideation (`docs/multimodel-repo-analysis/00-ideation/`) 의 명시적 권장 + 사용자 AskUserQuestion 옵션 A 승인 (synthesis §5). CTO 활성화 근거 = synthesis §1.2 P0 합의 (3 모델 모두 `analyzeCEO` 인터페이스 불일치를 P0 로 진단). CEO 7 차원 알고리즘 호출은 ideation 모드에서 이미 완료 (synthesis 가 활성화 C-Level 추천 결과 = CTO).

> 본 hotfix 자체가 CEO 알고리즘을 정상화하는 작업 — 자가 적용 (self-application) 의 좋은 케이스. AC-1 이 PASS 하면 v0.66.1 부터는 CEO 라우팅이 실제 입력을 보고 7 차원 등급을 산출.

## Next Phase

### CTO Design (선택)
- 본 hotfix 는 architecture 결정 없음 (1 줄 폴백 + 기존 manifest 의 version 필드 변경). design phase 생략 정당화 가능.
- 명령 (필요 시): `/vais cto design v0-66-1-hotfix-alignment`

### CTO Do (권장)
- tech-plan §3 9 step 실행. ~85 분 작업.
- 명령: `/vais cto do v0-66-1-hotfix-alignment`
- 사용 sub-agent: backend-engineer (α-1/3 + γ-1) + test-engineer (α-3 회귀 테스트) 병렬. β 시리즈는 CTO 직접 (간단한 매니페스트 편집).

> ⚠️ Mandatory phase 순서: plan → design → do → qa → report. design 생략은 명시적 사용자 승인 필요. tech-plan 이 architecture-level 결정이 없음을 §1 In-scope 표로 입증하므로 생략 정당화 가능 — qa-engineer 가 검증.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-12 | 초기 작성 — CTO plan phase 진입. 8 Decision Record + tech-plan.md 1 artifact. CP-0 강행 모드 (synthesis 가 PRD 등가) |
