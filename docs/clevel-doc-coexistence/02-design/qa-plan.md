---
owner: cto
authors: []
topic: qa-plan
phase: design
feature: clevel-doc-coexistence
---

# clevel-doc-coexistence — design — qa-plan

> Topic: qa-plan | Owner: cto | Phase: design
> 참조: `./main.md`, `./architecture.md`, `./data-model.md`

## 1. 테스트 전략 개요

| 레이어 | 도구 | 대상 |
|--------|------|------|
| Unit | `node:test` (기존) | `lib/status.js` / `lib/paths.js` |
| Integration | `node scripts/doc-validator.js` CLI | coexistenceWarnings 출력 |
| Smoke | bash + 샘플 피처 | 3 C-Level 공존 main.md + W-* 발화 |
| Self-dog-food | `scripts/doc-validator.js` | 본 피처 (`clevel-doc-coexistence`) 자체 |

## 2. 신규 테스트 케이스 (`tests/clevel-coexistence.test.js`)

| # | 케이스 | 검증 |
|---|--------|------|
| T1 | `getTopicPreset('01-plan', 'cpo')` v2 스키마 | `["requirements", "user-stories", "acceptance-criteria"]` 반환 |
| T2 | `getTopicPreset('01-plan', 'cto')` v1 스키마 (배열) | `_default` 배열 반환 (backward-compat) |
| T3 | `registerTopic` + `listFeatureTopics` 왕복 | status.json 저장 후 조회 |
| T4 | `W-OWN-01` 발화 | owner 누락 topic.md → validator 경고 |
| T5 | `W-OWN-02` 발화 | `owner: pm` 잘못된 값 |
| T6 | `W-MRG-02` 발화 | Decision Record 표에 Owner 컬럼 없는 main.md |
| T7 | `W-MRG-03` 발화 | owner 섹션 0개 + topic 2개 이상 |
| T8 | 재진입 규칙 — 같은 C-Level 자기 섹션 교체 | 변경 이력 entry 필수 |
| **T9 (F14)** | `W-MAIN-SIZE` 발화 | main.md 210라인 + topic 0 + `_tmp/` 0 → 경고 |
| **T10 (F14)** | `W-MAIN-SIZE` 비발화 | main.md 180라인 또는 topic ≥ 1 → 경고 없음 |

## 3. 회귀 가드 (기존 테스트 확장)

| 파일 | 추가 케이스 |
|------|------------|
| `tests/paths.test.js` | v0.57 `scratchpad` / `topic` / `scratchpadQualified` 경로 문자열 유지 확인 |
| `tests/status.test.js` | `subDocs[]` 시그니처 무변경 + `topics[]` 신규 필드 존재 |
| `tests/doc-validator.test.js` (있으면) | `W-SCP-*` / `W-TPC-*` / `W-IDX-*` 경고 코드 그대로 발화 |

## 4. Smoke Test 시나리오

### 4.1 3 C-Level 공존 (`docs/_smoke/coexist-smoke/01-plan/`)

1. `main.md` 에 `## [CBO]` / `## [CPO]` / `## [CTO]` 3섹션 + Decision Record 3행
2. `market-analysis.md` (owner: cbo)
3. `requirements.md` (owner 누락 → W-OWN-01)
4. `architecture-plan.md` (owner: invalid "pm" → W-OWN-02)
5. `node scripts/doc-validator.js cto coexist-smoke` 실행

**기대**: W-OWN-01 + W-OWN-02 발화, W-MRG-02/03 비발화 (구조 정상).

### 4.2 (F14) Size Budget 위반 (`docs/_smoke/size-budget-smoke/01-plan/`)

1. `main.md` 를 220 라인으로 작성 (topic 없음, `_tmp/` 없음)
2. `node scripts/doc-validator.js cto size-budget-smoke`

**기대**: `W-MAIN-SIZE` 발화 (`main.md 220 lines exceeds mainMdMaxLines (200)`).

### 4.3 (F14) 자가 검증 — 본 피처

`wc -l docs/clevel-doc-coexistence/01-plan/main.md` ≤ 200 AND `ls docs/clevel-doc-coexistence/01-plan/*.md | wc -l` ≥ 4 (main + 3 topic).
동일 02-design 에 대해서도 수행.

## 5. Acceptance Criteria (QA phase 입력)

QA phase 에서 `qa-engineer` 가 검증할 항목:
- SC-01~SC-14 전부 Pass (plan `policy.md` §3)
- **SC-15** — W-MAIN-SIZE 발화 smoke test
- **SC-16** — 본 피처 자가 적용 검증
- `matchRate ≥ 90`, `criticalIssueCount = 0`

## 6. 실패 시 대응 흐름

| 실패 유형 | 대응 |
|-----------|------|
| `W-OWN-*` 신규 발화 | clevel-main-guard 블록 복붙 누락 → patch-clevel-guard.js 재실행 |
| `W-MRG-02` 미발화 (거짓 음성) | validator regex 검토 (Owner 컬럼 헤더 파싱 정규식 수정) |
| `W-MAIN-SIZE` 임계 부적절 | `mainMdMaxLines` 조정 or 경고 튜닝 |
| `npm test` < 195 | 기존 v0.57 193 에 신규 ≥ 2 미달 → T1~T10 개별 디버깅 |
| plugin-validator 오류 | 0.57 → 0.58 버전 동기화 누락 (4 파일) |

## 7. 큐레이션 기록

| Source | 채택 | 거절 | 병합 | 추가 | 이유 |
|--------|:----:|:----:|:----:|:----:|------|
| design main.md v1.0 §5 | ✅ | | ✅ | | QA 계획 이관 |
| F14 반영 (v1.1) | | | | ✅ | T9/T10 케이스, §4.2 size budget smoke, §4.3 자가 검증 추가 |

## 8. 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-20 | 초기 — 테스트 전략, smoke 시나리오 (main.md 에서 추출) |
| v1.1 | 2026-04-20 | F14 — T9/T10 + §4.2 size budget smoke + §4.3 자가 검증 |
