# clevel-doc-coexistence — QA

> Feature: `clevel-doc-coexistence` | v0.57.0 → v0.58.0
> 참조: `../01-plan/main.md` v1.1, `../02-design/main.md` v1.1, `../03-do/main.md` v1.0
> <!-- size budget: main.md ≤ 200 lines 권장 (F14 자가 적용). -->

## Executive Summary

| Perspective | Content | Contributing C-Levels |
|-------------|---------|-----------------------|
| **Verdict** | **pass** — matchRate 100%, Critical 0건, Important 2건 **모두 v0.58 내 해결** (CP-Q B 선택) | cto |
| **Evidence** | npm test 210/0/3, plugin-validator 통과, 자가 doc-validator `coexistenceWarnings:[]`, W-MAIN-SIZE smoke 발화 확인 | cto |
| **Release Ready** | v0.58.0 릴리즈 가능. F14 자가 적용 증명됨 | cto |

## Decision Record (multi-owner)

| # | Decision | Owner | Rationale | Source topic |
|---|----------|:-----:|-----------|--------------|
| 1 | matchRate = 100% (SC 16/16 Met) | cto | 모든 SC 명시적 검증 통과 | 본 문서 §2 |
| 2 | pass (final) | cto | CP-Q B 선택으로 Important 2건도 v0.58 내 해결. 릴리즈 완전 clean | 본 문서 §4 |
| 3 | v0.57 `W-TPC-01` 오탐은 TD-4 로 차등 분리 | cto | 본 피처가 유발한 신규 이슈 아님. v0.57 정규식 기존 한계 | `../03-do/main.md` TD-4 |

## [CTO] QA 판정

### 빌드/실행 검증

| 항목 | 상태 | 비고 |
|------|:---:|------|
| `npm test` | ✅ | 210 pass / 0 fail / 3 skip (v0.57 193 → +17 SC-13 타겟 195 초과) |
| `node scripts/vais-validate-plugin.js` | ✅ | "검증 통과 — 플러그인/마켓플레이스 배포 준비 완료" (SC-14) |
| `node -e "JSON.parse(...vais.config.json)"` | ✅ | 스키마 v2 파싱 정상 |
| `node scripts/patch-clevel-guard.js` 2회 실행 | ✅ | 2회차 6/6 skip-same-version — idempotent (SC-10) |
| Smoke — 216 라인 main.md + topic 0 + `_tmp/` 0 | ✅ | `W-MAIN-SIZE` 발화 (`218 lines exceeds mainMdMaxLines (200)`) — SC-15 |
| 자가 검증 — `clevel-doc-coexistence` doc-validator | ✅ | `coexistenceWarnings: []` (SC-16) |

## Topic Documents

(QA main.md 단독. topic 분리 기준 미달 — 본 문서 ~140 라인.)

| Topic | 파일 | Owner | 요약 |
|-------|------|:-----:|------|
| (해당 없음) | — | — | — |

## Scratchpads

| Agent | 경로 | 크기 | 갱신 |
|-------|------|:---:|-----|
| (해당 없음 — CTO 직접 QA) | — | — | — |

## 1. Success Criteria Matching (Gap 분석)

| ID | Criterion | Status | Evidence |
|----|-----------|:------:|----------|
| SC-01 | topicPresets v2 + backward-compat | ✅ Met | `tests/clevel-coexistence.test.js` T1/T2, `lib/status.js > getTopicPreset()` duck-typing |
| SC-02 | F2 owner frontmatter + W-OWN-01 | ✅ Met | T4 pass |
| SC-03 | main.md H2 + Decision Record Owner 컬럼 | ✅ Met | T7 + 본 피처 plan/design/do/qa main.md 4건 모두 준수 |
| SC-04 | 6 agent md 블록 복붙 | ✅ Met | `grep -c "clevel-main-guard version:" agents/{6 c-level}/*.md` = 6 |
| SC-05 | canonical 존재 | ✅ Met | `agents/_shared/clevel-main-guard.md` (11 섹션, v0.58.0) |
| SC-06 | 5 templates 업데이트 | ✅ Met | size budget 주석 + Decision Record (multi-owner) 섹션 + version v0.58.0 |
| SC-07 | Rule #15 + AGENTS/README 동기화 | ✅ Met | `CLAUDE.md:144` + `AGENTS.md:49` + `README.md:274+` |
| SC-08 | cLevelCoexistencePolicy 정책 키 | ✅ Met | `vais.config.json` 8 필드(F14 2필드 포함) |
| SC-09 | status.js topics[] + 7 신규 함수 | ✅ Met | `registerTopic`/`listFeatureTopics`/`getFeatureTopics`/`listScratchpadAuthors`/`getOwnerSectionPresence`/`getMainDocSize`/`getTopicPreset` + tests T3/T8/F14 helpers |
| SC-10 | patch-clevel-guard idempotent | ✅ Met | 2회차 실행 6/6 skip-same-version |
| SC-11 | 4 파일 버전 0.58.0 + CHANGELOG | ✅ Met | `package.json`/`plugin.json`/`marketplace.json`/`vais.config.json` + CHANGELOG v0.58.0 엔트리 |
| SC-12 | 3 C-Level 공존 smoke | ✅ Met | T7 + 샘플 main.md with `## [CTO]` + `## [CPO]` 2섹션 + topic 2 |
| SC-13 | npm test ≥ 195 pass | ✅ Met | **210 pass / 0 fail** (타겟 +15 초과) |
| SC-14 | plugin-validator 0 오류 | ✅ Met | "검증 통과" |
| SC-15 | W-MAIN-SIZE smoke 발화 | ✅ Met | /tmp/vais-smoke-coexist — 218 라인 → 경고 발화 |
| SC-16 | 본 피처 자가 적용 | ✅ Met | 01-plan 81라인, 02-design 94라인, 03-do 96라인, 04-qa ~140라인 — 모두 ≤ 200. topic 3+3=6건, `coexistenceWarnings: []` |

**매칭 결과**: **18/18 Met** → matchRate **100%** (SC-01~16 + TD-4/TD-5 해결로 SC-17/18 추가, threshold 90% ✅)

## 2. 미구현 항목 (Gap)

**없음**. MVP 14 기능(F1~F9, F11~F14) 전부 구현 완료.

Deferred 항목(MVP 제외 — 설계 시점에 이미 범위 밖):
- F10 CEO 컨텍스트 자동 전파 구현 → v0.58.1
- W-MRG-01 git 이력 기반 → v0.58.1
- `enforcement=fail` 강제화 → v0.59+
- 자동 conflict resolver → 범위 밖

## 3. 불일치 항목 (Mismatches)

**없음**. Plan/Design 결정대로 모두 구현. Design 이탈 기록(03-do §Design 이탈): 없음.

## 4. Issue 요약

**Critical: 0**

**Important: 0** (CP-Q B 선택 — TD-4/TD-5 모두 v0.58 내 해결)

| # | 이슈 | ID | 영향 | 해결 |
|---|------|----|------|------|
| 1 | v0.57 `W-TPC-01` 정규식 `^##\s+큐레이션 기록` 가 `## N. 큐레이션 기록` 번호 접두를 미인식 | TD-4 | warn 6건 오탐 | ✅ **Fixed** — `scripts/doc-validator.js:148` 정규식 `^##\s+(?:[\d.]+\s+)?큐레이션\s*기록` → 오탐 0건 |
| 2 | `patch-subdoc-block.js` / `patch-clevel-guard.js` 2종 body-block 주입 로직 중복 (patch-advisor-frontmatter 는 별개 frontmatter 수정) | TD-5 | 유지보수성 저하 | ✅ **Fixed** — `lib/patch-block.js` 신설, 2 스크립트 thin wrapper 로 전환, 6+36 파일 idempotent 재검증 |

## 5. 보안/위험 리뷰 (간이)

| 항목 | 평가 |
|------|------|
| 시크릿 노출 | ✅ 없음 (신규 코드에 하드코딩된 API 키/토큰 없음) |
| 경로 탐색 | ✅ `validateFeatureName` 재사용으로 path traversal 방어 |
| 파일 쓰기 | ✅ `status.js` 에서 `atomicWriteSync` 사용 (기존 패턴 준수) |
| 에이전트 md 주입 공격 | ✅ `patch-clevel-guard.js` 가 canonical 소스만 사용, 블록 마커로 경계 |
| v0.57 호환 회귀 | ✅ `subDocs[]`/`_tmp/`/`W-SCP-*`/`W-TPC-01`/`W-IDX-01` 무변경 |

보안 전용 검토는 CSO 가 별도 수행 가능(선택). 본 QA 는 CTO 레벨 간이 리뷰만.

## 6. Gate Metrics (v0.56+)

| Metric | Target | Final | 판정 |
|--------|--------|-------|:---:|
| `matchRate` | ≥ 90 | **100** | ✅ |
| `criticalIssueCount` | === 0 | **0** | ✅ |

auto-judge 기반: `.vais/status.json > gapAnalysis.matchRate = 100`, `passed = true` → Gate 통과.

## 7. return_to / 후속 조치

| 항목 | 위임 대상 | 필요성 |
|------|----------|:-----:|
| CSO 독립 보안 리뷰 | CSO | 선택 (메타 피처 — 코드 보안 영향 낮음) |
| TD-4 W-TPC-01 정규식 수정 | CTO (v0.58.1) | 선택 |
| TD-5 patch 스크립트 공통화 | CTO (v0.59+) | 선택 |
| Report phase 진입 | CTO report | **권장** — 릴리즈 준비 완료 |

## 8. 릴리즈 판정

| 항목 | 값 |
|------|-----|
| Verdict | **pass** |
| Release Ready | ✅ v0.58.0 |
| Blockers | 없음 |
| Rollback Plan | `git revert` 1 commit (v0.57 단일 릴리즈 커밋과 동등 단순도) |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-20 | 초기 QA — matchRate 100%, Critical 0, Important 2(TD 이관 예정), pass 판정 |
| v1.1 | 2026-04-20 | CP-Q B 선택 반영 — TD-4 (`W-TPC-01` 정규식) + TD-5 (`lib/patch-block.js` 공통화) 모두 v0.58 내 해결. SC-17/18 추가, Important 0 건 |
