---
owner: cto
authors: []
topic: policy
phase: plan
feature: clevel-doc-coexistence
---

# clevel-doc-coexistence — plan — policy

> Topic: policy | Owner: cto | Phase: plan
> 참조: `./requirements.md`, `./impact-analysis.md`, `./main.md`

## 1. Scope & 제약

### 포함
플러그인 내부 convention + config + validator + 6 C-Level agent md + templates + docs. F14 를 v1.1 에서 편입.

### 제외
- 기존 v0.56/v0.57 피처 재마이그레이션 (호환성 원칙)
- `enforcement=fail` (v0.59+)
- CEO 컨텍스트 자동 전파 (F10, v0.58.1+)
- 자동 conflict resolver (범위 초과)
- `W-MRG-01` git 이력 기반 (v0.58.1)

### 제약
- Rule #14 (v0.57 sub-doc) 와 충돌 없음 — 상위 호환
- `scripts/doc-validator.js` exit code 영향 없음 (warn only)
- 기존 `subDocs[]` 스키마 무변경

## 2. Design 이관 Open Questions (D-Q)

Design 단계에서 결정됨 (참조: `../02-design/architecture.md` / `../02-design/data-model.md`).

| ID | 질문 | Design 결정 |
|----|------|-----------|
| D-Q1 | `mainMergeRule` 기본값 | **`append-only`** (diff-merge 는 v0.59+) |
| D-Q2 | `W-MRG-01` 구현 방식 | **v0.58.1 이연** (v0.58 은 텍스트 기반 W-MRG-02/03 만) |
| D-Q3 | `authors: []` 자동 채움 | **수동 + `listScratchpadAuthors` 헬퍼** |
| D-Q4 | 6 agent md 블록 순서 | **advisor → subdoc → clevel-main** (마지막) |
| D-Q5 | 재진입 규칙 | 자기 섹션 교체 + `## 변경 이력` entry 필수 |
| D-Q6 | CEO 자동 전파 | **v0.58 인터페이스만**(`getFeatureTopics`), 구현 v0.58.1 |

**(F14) D-Q7 추가** (v1.1): main.md size threshold 기본값 — **200 라인**. 초과 시 warn(v0.58), refuse(v0.59+).

## 3. Success Criteria

| ID | Criterion | Target | Evidence |
|----|-----------|--------|----------|
| SC-01 | F1 topicPresets 확장 + backward-compat | 배열/객체 형태 모두 읽힘 | `tests/paths.test.js` |
| SC-02 | F2 owner frontmatter + F4 W-OWN-01 | 누락 시 경고 | `tests/clevel-coexistence.test.js` |
| SC-03 | F3 main.md H2 섹션 + F3b Decision Record Owner 컬럼 | 샘플 피처에 3 C-Level 섹션 공존 | smoke |
| SC-04 | F5 6 agent md 블록 복붙 | `grep -c "clevel-main-guard begin" agents/*/*.md` = 6 | grep |
| SC-05 | F6 canonical 존재 | `ls agents/_shared/clevel-main-guard.md` | ls |
| SC-06 | F7 5 templates 업데이트 + 각 template 에 `## [...]` 플레이스홀더 + size budget 주석 | grep 확인 | grep |
| SC-07 | F8 Rule #15 + AGENTS/README 동기화 | 동일 규약 텍스트 | grep |
| SC-08 | F9 `cLevelCoexistencePolicy` 정책 키 (F14 필드 포함) | config 에 존재 + validator 참조 | grep, tests |
| SC-09 | F11 status.js `topics[]` + 신규 함수 6종 | npm test pass | npm test |
| SC-10 | F12 patch-clevel-guard idempotent | 2회 실행 no-op | bash |
| SC-11 | F13 4 파일 + CHANGELOG v0.58.0 | grep | grep |
| SC-12 | Smoke — 3 C-Level 공존 샘플에서 W-OWN/W-MRG 발화 | validator 호출 | bash |
| SC-13 | `npm test` ≥ 195 pass (v0.57 193 + 신규 ≥ 2) | npm test | npm test |
| SC-14 | `plugin-validator` 0 오류 | `node scripts/vais-validate-plugin.js` | bash |
| SC-15 | **(F14)** `W-MAIN-SIZE` 발화 — 210라인 main.md + topic 0 | 샘플 피처 smoke | bash |
| SC-16 | **(F14) 자가 적용** — `clevel-doc-coexistence` 자체 01-plan / 02-design main.md ≤ 200 lines + topic ≥ 3 | wc -l + ls | bash |

## 4. 기술 접근 (강행 모드 기록)

**CP-0 선택 B**: PRD 없이 Ideation + 본 plan 을 소스로 사용. CPO 차후 보강 가능 (v0.58.1).

### 기술 변환 (ideation → technical)

| ideation 결정 | 기술 변환 |
|---------------|-----------|
| topic-first 파일명 | frontmatter `owner` 필드 |
| main.md append-merge | H2 헤딩 섹션 + Decision Record 표 + Topic 인덱스 |
| `topicPresets.{phase}.{c-level}` | backward-compatible 객체/배열 duck-typing |
| 5 phase 전체 적용 | 5 templates 동시 수정 |
| v0.57 호환 | `_tmp/` / `subDocs[]` / subdoc-guard 무변경 |
| **(F14) 사용자 지적** | `mainMdMaxLines` + `W-MAIN-SIZE` + size budget 규칙 |

### Walking Skeleton (Do 분할)

| Batch | 범위 | 목적 |
|-------|------|------|
| A | F1 + F6 + F7 + F9 (config/guard/templates/policy, **F14 필드 포함**) | 기본 인프라 |
| B | F5 + F12 (6 agent md 패치 + patch 스크립트) | agent 런타임 규칙 |
| C | F4 + F11 (validator W-* + status.js + **F14 `getMainDocSize`**) | 검증 체계 |
| D | F8 + F13 + smoke + **F14 자가 적용 검증** (SC-15/16) | 릴리즈 준비 |

## 5. 리스크 & 대응

| Risk | Likelihood | Impact | Mitigation |
|------|:---------:|:------:|-----------|
| `includes:` 런타임 미통합 (v0.57 TD-2) | High | High | Option A 블록 복붙 + patch 스크립트 |
| v0.57 `subDocs[]` 검증 충돌 | Medium | Medium | `topics[]` 로 완전 분리 |
| H2 헤딩 규칙 위반 | Medium | Medium | `W-MRG-02/03` + clevel-main-guard |
| 6 C-Level agent md PR diff 과대 | Low | Low | patch 스크립트로 자동 생성 |
| **(F14) 200 라인 threshold 부적절** | Medium | Low | 정책 키로 사용자 조정 가능 |

## 6. 큐레이션 기록

| Source | 채택 | 거절 | 병합 | 추가 | 이유 |
|--------|:----:|:----:|:----:|:----:|------|
| main.md v1.0 §3/§6/§7 | ✅ | | ✅ | | Scope/SC/기술접근 이관 |
| F14 반영 | | | | ✅ | SC-15/16 + D-Q7 + Walking Skeleton 주석 추가 |

**누락/충돌**: 없음.

## 7. 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-20 | 초기 — Scope/SC/기술접근/리스크 (main.md 에서 추출) |
| v1.1 | 2026-04-20 | F14 편입 (SC-15/16, D-Q7, Batch 주석, 리스크 추가) |
