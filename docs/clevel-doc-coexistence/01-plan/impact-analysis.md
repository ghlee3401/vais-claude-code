---
owner: cto
authors: []
topic: impact-analysis
phase: plan
feature: clevel-doc-coexistence
---

# clevel-doc-coexistence — plan — impact-analysis

> Topic: impact-analysis | Owner: cto | Phase: plan
> 참조: `./requirements.md` (F1~F14), `./main.md`

## 1. 요약

| 구분 | 개수 |
|------|-----:|
| New | 5 파일 |
| Changed | ~22 파일 |
| Removed | 0 (v0.57 호환 원칙) |

## 2. New files (5)

| Path | Type | Purpose | Feature ID |
|------|------|---------|:----------:|
| `agents/_shared/clevel-main-guard.md` | canonical guard | 6 agent md 블록 복붙 소스 | F6 |
| `scripts/patch-clevel-guard.js` | build util | idempotent agent md 패치 | F12 |
| `tests/clevel-coexistence.test.js` | test | W-* 경고, registerTopic, F14 size budget 회귀 가드 | F4/F11/F14 |
| `docs/clevel-doc-coexistence/01-plan/*.md` topics | plan topic | 본 topic 3개 (requirements/impact-analysis/policy) | — |
| `docs/clevel-doc-coexistence/02-design/*.md` topics | design topic | 본 topic 3개 (architecture/data-model/qa-plan) | — |

## 3. Changed files (~22)

### Config (1)
| 파일 | 변경 |
|------|------|
| `vais.config.json` | F1 `topicPresets` phase×c-level 확장 (`_schemaVersion: 2`) + F9 `cLevelCoexistencePolicy` 추가(**F14** `mainMdMaxLines`/`mainMdMaxLinesAction` 포함) + version 0.58.0 |

### Libs/Scripts (2)
| 파일 | 변경 |
|------|------|
| `lib/status.js` | F11 `registerTopic`/`listFeatureTopics`/`listScratchpadAuthors`/`getOwnerSectionPresence`/`getFeatureTopics`/**`getMainDocSize`(F14)** + `topics[]` 스키마 |
| `scripts/doc-validator.js` | F4 `W-OWN-01/02` + `W-MRG-02/03` + **`W-MAIN-SIZE`(F14)** + `coexistenceWarnings[]` JSON 필드 |

### Agents (6) — F5 블록 복붙 (automated by F12)
`agents/ceo/ceo.md`, `agents/cpo/cpo.md`, `agents/cto/cto.md`, `agents/cso/cso.md`, `agents/cbo/cbo.md`, `agents/coo/coo.md`

### Templates (5)
`templates/{plan,design,do,qa,report}.template.md`

공통 변경: Contributing C-Levels 컬럼 + Decision Record Owner 컬럼 + `## [{C-LEVEL}]` 플레이스홀더 + **(F14) size budget 주석**.

### Docs (3)
| `CLAUDE.md` | F8 Rule #15 신설 (F14 포함) |
| `AGENTS.md` | 동기화 |
| `README.md` | 해당 섹션 동기화 |

### Release (4)
`package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` version 0.58.0 + `CHANGELOG.md` v0.58.0 엔트리.

### Tests (1)
`tests/paths.test.js` 회귀 가드.

## 4. F14 증분

| 파일 | F14 이전 | F14 이후 |
|------|---------|----------|
| `vais.config.json` cLevelCoexistencePolicy | 6 필드 | +2 (`mainMdMaxLines`, `mainMdMaxLinesAction`) |
| `lib/status.js` | 5 신규 함수 | +1 (`getMainDocSize`) |
| `scripts/doc-validator.js` | W-OWN/W-MRG 4건 | +1 (`W-MAIN-SIZE`) |
| `agents/_shared/clevel-main-guard.md` | 8 섹션 | +1 (§8 size budget) |
| 5 templates | 3 공통 변경 | +1 (size budget 주석) |
| `CLAUDE.md` Rule #15 | 기본 규약 | +1 문장 (F14 편입) |
| `tests/clevel-coexistence.test.js` | 8 케이스 | +2 (T9/T10 size budget) |

**증분**: +9 위치, PR diff ~50 라인 예상.

## 5. Blast radius

| 영역 | 영향 | 완화 |
|------|------|------|
| v0.57 `_tmp/` 유저 | 무영향 | 신규 정책 키. 기존 경로·함수·경고 무변경 |
| 기존 v0.56/v0.57 피처 | 무영향 | 마이그레이션 스킵 |
| Claude Code 플러그인 사용자 | 긍정적 | main.md 비대화 자동 감지 |
| 6 agent md PR diff | 중간 | patch 스크립트로 자동화 |

## 6. 큐레이션 기록

| Source | 채택 | 거절 | 병합 | 추가 | 이유 |
|--------|:----:|:----:|:----:|:----:|------|
| main.md v1.0 §4 | ✅ | | ✅ | | Changed/New/Removed 표 이관 + 구분 재정렬 |
| requirements.md F14 | | | | ✅ | §4 F14 증분 신설 |
| 사용자 원문 | ✅ | | | | §5 Blast radius 에 반영 |

**충돌 점검**: F14 가 v0.57 `subDocPolicy` 미수정 — 별도 키 `cLevelCoexistencePolicy` 에 추가 ✅.

## 7. 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-20 | 초기 — Changed/New/Removed (main.md 에서 추출) |
| v1.1 | 2026-04-20 | F14 증분 §4, Blast radius §5 |
