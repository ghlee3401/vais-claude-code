---
owner: cto
artifact: tech-plan
phase: plan
feature: v0-66-1-hotfix-alignment
generated: 2026-05-12
source: docs/multimodel-repo-analysis/00-ideation/synthesis.md §4 (P0-α / P0-β / P0-γ) + §3.2 (수정 전략)
summary: "3 모델 합의 P0 3 항을 v0.66.1 hotfix 로 묶어 1~2 시간 안에 release. CEO 라우팅 회복 + 버전·메타 정렬 + session-start 4-토큰 안내."
---

# v0-66-1-hotfix-alignment — CTO 기술 계획

## 0. 요청 원문 (synthesis 인용)

> "옵션 A — v0.66.1 hotfix plan. P0 3 항 (α `analyzeCEO` 수정 + 회귀 테스트 / β 버전 메타 정렬 / γ session-start 4-토큰) 만. CTO plan 으로 즉시 진입. 1~2시간 hotfix release." (`docs/multimodel-repo-analysis/00-ideation/synthesis.md` §5 옵션 A — Claude 추천 + 사용자 승인)

근거 분석 = Codex/Claude/Gemini 3 모델 합의 (synthesis §1.2).

## 1. In-scope

| ID | 변경 | 파일 | 변경 유형 |
|----|------|------|----------|
| α-1 | `analyzeCEO` 진입에 `rawText || input` 폴백 + JSDoc 명시 | `lib/ceo-algorithm.js` | modify |
| α-2 | `analyzeCEO` 호출 안내를 `rawText` 정본으로 정정 | `agents/ceo/ceo.md` | modify |
| α-3 | 회귀 테스트 신설 — `rawText` 정본 / `input` 알리아스 / 7 차원 등급 산출 / activeCLevel 매핑 4 케이스 | `tests/ceo-algorithm.test.js` | create |
| β-1 | 버전 일괄 0.66.1 로 bump | `package.json`, `vais.config.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (`metadata.version` + `plugins[0].version`) | modify |
| β-2 | CLAUDE.md 의 "v0.65.3" 라벨을 "v0.66.1" 로 정정 | `CLAUDE.md` | modify |
| β-3 | ONBOARDING.md 의 버전·정합성 라벨 정정 | `ONBOARDING.md` | modify |
| β-4 | marketplace.json description 의 "frontmatter 8 fields" → "4 필드" 정정 | `.claude-plugin/marketplace.json` | modify |
| β-5 | CHANGELOG.md 에 v0.66.1 entry 추가 (Keep a Changelog 형식: Fixed / Changed) | `CHANGELOG.md` | modify |
| γ-1 | session-start 명령 안내를 4-토큰 형식으로 정렬 | `hooks/session-start.js` (대략 117-120 라인) | modify |

## 2. Out-of-scope

- P1 (δ COO whitelist 동적화 / ε doc-validator W-MRG-03 / ζ — 회귀 테스트는 α-3 으로 흡수됨 / η M0 운영 검증 / θ PO 진입점 일관화) — v0.66.2 별도 sprint.
- P2 (ι Knowledge Pack 3 C-Level 보강 / κ MCP 산출 위치 정책) — v0.67.
- README.md 정합 — 본 repo 에 README.md 미존재 시 skip.
- v0.66.0 GA tag rollback — 유지 (synthesis §3.3).

## 3. 작업 순서 (실행 sequence)

| Step | 작업 | 사전조건 | 검증 |
|------|------|---------|------|
| 1 | α-1: `analyzeCEO` 폴백 1 줄 + JSDoc | — | unit test FAIL → PASS 전환 |
| 2 | α-3: 회귀 테스트 작성 | Step 1 | 4 케이스 모두 PASS |
| 3 | α-2: `agents/ceo/ceo.md:41` 의 `input` → `rawText` 표기 정정 | Step 1 | grep `'{input:'` in agents/ceo/ → 0 |
| 4 | β-1: 4 매니페스트 파일 0.66.1 bump | — | `node -e "console.log(require('./package.json').version)"` = 0.66.1 (4 파일 동일) |
| 5 | β-2/3: CLAUDE.md / ONBOARDING.md 버전 라벨 정정 | Step 4 | grep 'v0\\.65\\.3' = 0 |
| 6 | β-4: marketplace.json description "8 fields" → "4 필드" | Step 4 | grep '8 fields' = 0 |
| 7 | γ-1: hooks/session-start.js 명령 안내 4-토큰화 | — | session-start 출력에 `/vais ceo` / `/vais cto` / `/vais status` / `/vais help` 형식 |
| 8 | β-5: CHANGELOG v0.66.1 entry | 위 7 단계 모두 | Keep a Changelog 6 섹션 중 Fixed/Changed 필수 |
| 9 | 통합 검증 | 1-8 | `npm test` PASS / `npm run lint` PASS / `node scripts/vais-validate-plugin.js .` PASS / git status 정리 |

## 4. Acceptance Criteria

| AC | 검증 항목 | 검증 방법 |
|----|----------|----------|
| AC-1 | `analyzeCEO({input: '...', feature: 'x'})` 호출이 default-only 가 아닌 실제 7 차원 등급 산출 | unit test (인증 키워드 포함 입력 → 보안 차원 ≥ medium) |
| AC-2 | `analyzeCEO({rawText: '...', feature: 'x'})` 호출이 동일 결과 | unit test (동일 입력 → 동일 grade 객체) |
| AC-3 | 매니페스트 4 파일 버전 모두 `0.66.1` | grep + JSON.parse |
| AC-4 | CLAUDE.md / ONBOARDING.md 에 `v0.65.3` 잔존 0 | `grep -rn 'v0\\.65\\.3' CLAUDE.md ONBOARDING.md` |
| AC-5 | marketplace.json description 에 "8 fields" 잔존 0 | grep |
| AC-6 | hooks/session-start.js 의 명령 예시가 모두 4-토큰 `/vais {c-level} {phase} {feature}` 또는 utility (`/vais status`, `/vais help`) | session-start 출력 캡처 + 4-토큰 정규식 매치 |
| AC-7 | `npm test` 통과 (기존 281 + 신규 회귀 테스트) | CI 명령 |
| AC-8 | `node scripts/vais-validate-plugin.js .` 통과 | CI 명령 |
| AC-9 | CHANGELOG.md 에 `## [0.66.1]` 헤더 + Fixed/Changed 섹션 | grep + Keep a Changelog 규약 점검 |

## 5. 리스크 & 완화

| 리스크 | 가능성 | 완화 |
|--------|-------:|------|
| α-1 hotfix 라인이 `request` 가 `undefined`/null 일 때 깨짐 | 낮음 | 회귀 테스트에 falsy 케이스 추가 |
| 버전 bump 시 매니페스트 4 파일 중 1 누락 | 중간 | Step 4 검증을 4 파일 모두 grep 로 확인 |
| `hooks/session-start.js` 변경이 기존 dogfood 시나리오 break | 낮음 | 변경 전 출력 vs 후 출력 diff 확인, 기능 변경 X (안내 문구만) |
| 회귀 테스트가 `analyzeDimensions` heuristics 변경에 brittle | 중간 | grade 정확 값 대신 `gradeAtLeast` 로 단조성 검증 |
| GA tag rollback 압력 | 낮음 | synthesis §3.3 결정 = 유지. v0.66.1 hotfix release 로 봉합 |

## 6. 검증 방법 (QA phase 예고)

- **유닛**: `tests/ceo-algorithm.test.js` 4 케이스 (rawText 정본 / input 알리아스 / 7 차원 등급 매핑 / activeCLevel 추출)
- **통합**: `npm test` 전체 — 기존 281 무회귀
- **하네스**: `node scripts/vais-validate-plugin.js .` — frontmatter 무결성
- **수동 dogfood**: `node -e "const a=require('./lib/ceo-algorithm'); console.log(JSON.stringify(a.analyzeCEO({input: '신규 결제 API 와 GDPR 컴플라이언스 통합', feature: 'payment-gdpr'}), null, 2))"` — 보안/컴플라이언스 차원이 default 가 아닌 ≥ medium

## 7. 작업 시간 추정

| Step | 추정 |
|------|-----:|
| α-1 + α-2 + α-3 (`analyzeCEO` 수정·문서·회귀) | 35 분 |
| β-1~β-5 (버전·메타·CHANGELOG) | 25 분 |
| γ-1 (session-start 안내 4-토큰) | 15 분 |
| Step 9 통합 검증 | 10 분 |
| **총 (단일 PR)** | **85 분 (≈1.5 시간)** |

## 8. 사후 추적 (관찰 — Rule #9)

- **P1-θ** (PO 진입점 일관화 — ONBOARDING vs session-start 시나리오) 는 본 hotfix 의 γ-1 에서 *문구 정렬* 만 처리. ONBOARDING.md 의 권장 시나리오 자체 재설계는 v0.66.2 별도.
- **P1-ζ** (회귀 테스트 신설) 는 α-3 으로 흡수됨. 추가 항목 (analyzeDimensions heuristic 회귀, buildArtifactPlan 매핑 회귀) 은 v0.66.2 확장.
- **P1-η** (M0 운영 검증 보류) 는 본 hotfix 와 분리. v0.66.2 sprint.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-12 | 초기 작성 — synthesis §4 + §5 옵션 A 박제. 9 변경 단위 + 9 AC + 5 리스크 + 85 분 추정 |
