# clevel-doc-coexistence — 구현 로그

> Feature: `clevel-doc-coexistence` | v0.57.0 → v0.58.0
> 선행: `../01-plan/main.md` v1.1 + `../02-design/main.md` v1.1 + `../02-design/interface-contract.md` v1.1
> <!-- size budget: main.md ≤ 200 lines 권장 (F14). -->

## Executive Summary

| Perspective | Content | Contributing C-Levels |
|-------------|---------|-----------------------|
| **Result** | 4 Batch 순차 구현 완료 (A→B→C→D). 14 MVP 기능 전부 적용 | cto |
| **Validation** | `npm test` **210 pass / 0 fail / 3 skip** (v0.57 193 → +17). Smoke test W-MAIN-SIZE 발화 확인 | cto |
| **Self-check** | clevel-doc-coexistence 자체 문서 `coexistenceWarnings: []` — SC-16 통과 | cto |
| **Deferred** | W-MRG-01 git 이력 기반, F10 CEO 자동 전파 구현, enforcement=fail → v0.58.1/v0.59 | cto |

## Decision Record (multi-owner)

| # | Decision | Owner | Rationale | Source topic |
|---|----------|:-----:|-----------|--------------|
| 1 | W-MRG-02 정규식 `search + slice` 방식으로 재작성 | cto | 초기 `m` 플래그 + 비탐욕 `*?` 조합으로 T6 실패. `drHeaderIdx` 위치 기반으로 안정화 | (본 문서) |
| 2 | T2 backward-compat 테스트는 topicPresets 만 surgical 교체 | cto | 전체 config 덮어쓰기 시 `cSuite`/`orchestration` 필수 필드 누락 에러. 부분 교체가 안전 | (본 문서) |
| 3 | `agents/_shared/clevel-main-guard.md` 마커는 v0.57 subdoc-guard 와 동일한 `<!-- ... version: vX.Y.Z -->` 포맷 | cto | patch-clevel-guard.js 가 동일 idempotent 로직 재사용 가능 | design `architecture.md` §2.1 |
| 4 | 템플릿 5종은 기존 구조를 보존하면서 신규 섹션 append | cto | 기존 템플릿 사용자 영향 최소화. Decision Record (multi-owner) 는 Context Anchor 뒤에 추가 | (본 문서) |

## [CTO] 구현 상세

### Batch A — Config + Guard + Templates

- `vais.config.json`: version 0.57.0→0.58.0, `topicPresets` v2 스키마(phase×c-level), `cLevelCoexistencePolicy` 8 필드(F14 포함)
- `agents/_shared/clevel-main-guard.md`: canonical 11 섹션, v0.58.0 버전 마커
- 5 templates: size budget 주석 + Decision Record (multi-owner) + `## [{C-LEVEL}]` 플레이스홀더 + version v0.58.0
- JSON parse 검증 ✅

### Batch B — 6 agent md 패치

- `scripts/patch-clevel-guard.js`: v0.57 `patch-subdoc-block.js` 선례 복제. idempotent 로직 동일
- 실행 결과: 6/6 신규 삽입 (ceo/cpo/cto/cso/cbo/coo), 2회차 실행 시 6/6 skip-same-version ✅
- SC-04: `grep -c "clevel-main-guard version:" agents/{ceo,cpo,cto,cso,cbo,coo}/*.md` = 6 ✅

### Batch C — Validator + status.js

- `scripts/doc-validator.js`: `validateCoexistence()` + `coexistenceWarnings[]` + `formatCoexistenceWarnings()` + CLI 통합
  - W-OWN-01 (owner 누락) / W-OWN-02 (invalid owner) / W-MRG-02 (Decision Record Owner 컬럼) / W-MRG-03 (topic ≥ 2 + owner 섹션 0) / W-MAIN-SIZE (F14)
- `lib/status.js`: 7 신규 함수 (`getTopicPreset`, `registerTopic`, `listFeatureTopics`, `getFeatureTopics`, `listScratchpadAuthors`, `getOwnerSectionPresence`, `getMainDocSize`) + `features.{name}.docs.topics[]` 인벤토리
- 실시간 검증: `getTopicPreset('plan', 'cpo')` → `[requirements, user-stories, acceptance-criteria]` ✅ / `(plan, cto)` → `[architecture-plan, impact-analysis, tech-risks]` ✅ / `(do, cso)` → `_default` 폴백 ✅

### Batch D — Docs + Version + Tests + Smoke

- `CLAUDE.md`: Rule #15 신설 + 프로젝트 버전 0.56.2→0.58.0
- `AGENTS.md`: Rule #8 (C-Level 공존) 동기화
- `README.md`: Document Structure 섹션에 v0.58 블록 추가
- 4 release 파일: `package.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` → 0.58.0
- `CHANGELOG.md`: [0.58.0] 엔트리 (Added/Changed/Compat/Deferred/Self-dog-food 5 섹션)
- `tests/clevel-coexistence.test.js`: T1~T10 + F14 helpers (17 케이스)
- Smoke: `docs/size-budget-smoke/01-plan/main.md` 218 라인 → `W-MAIN-SIZE` 발화 확인 ✅
- `npm test`: **210 pass / 0 fail / 3 skip** (v0.57 193 → +17, SC-13 타겟 195 초과 달성)

## Topic Documents

(Do phase 는 main.md 단독. topic 분리는 복잡도 기준 미달 — 본 main.md 116 라인.)

| Topic | 파일 | Owner | 요약 |
|-------|------|:-----:|------|
| (해당 없음) | — | — | — |

## Scratchpads

| Agent | 경로 | 크기 | 갱신 |
|-------|------|:---:|-----|
| (해당 없음 — CTO 직접 구현) | — | — | — |

## Design 이탈 항목

**없음**. Plan/Design 결정대로 모두 구현. F14 는 Design v1.1 에서 이미 편입된 상태로 Do 진입.

## 미완료 항목 (다음 phase 인계)

| # | 항목 | 담당 phase |
|---|------|-----------|
| 1 | SC-15 smoke 기록 영구화 (현재 /tmp 에서만) — 필요 시 `docs/_smoke/size-budget-smoke/` 로 이전 | qa (선택) |
| 2 | topic 문서 `## 큐레이션 기록` 섹션 이름 — v0.57 validator 가 `## N. 큐레이션 기록` 같은 번호 접두를 인식 못함 (W-TPC-01 오탐) | TD-4 (후속) |
| 3 | W-MRG-01 git 이력 기반 구현 | v0.58.1 |
| 4 | F10 CEO 컨텍스트 자동 전파 구현 | v0.58.1 |

## 발견한 기술 부채

| ID | 우선순위 | 내용 |
|----|:-------:|------|
| TD-4 | Low | 본 피처 자체 topic 문서(`## 4. 큐레이션 기록` 번호 접두) 가 v0.57 `W-TPC-01` 정규식 `^##\s+큐레이션` 와 매칭 안 됨 — 오탐 6건. 수정 옵션: (a) 정규식 완화 `/^##[\s\d\.]+큐레이션/m` (b) topic 문서 헤딩 리네임. 경고만이고 기능 영향 없음 |
| TD-5 | Medium | `scripts/patch-advisor-frontmatter.js` / `patch-subdoc-block.js` / `patch-clevel-guard.js` 3종이 거의 동일 로직 — 공통 라이브러리로 리팩토링 (v0.59+) |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-20 | 초기 — Batch A/B/C/D 구현 로그, 210 pass, W-MAIN-SIZE 발화 확인 |
