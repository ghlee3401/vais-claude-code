---
owner: cto
agent: cto-direct
artifact: replace-spec
phase: plan
feature: unify-version-namespace
generated: 2026-05-03
summary: "79 파일 4 카테고리 (drop/keep/rephrase/historical) 분류 + 정확 치환 규칙 + 예시. do 단계 자동화 baseline."
---

# Replace Spec — 79 파일 4 카테고리 분류

## 카테고리 A: DROP (아키텍처 라벨, 사용자 노출)

architecture 세대 이름. plugin semver 와 의미 중복 → 제거.

### 대상 파일 (~30)

| 영역 | 파일 | 패턴 |
|------|------|------|
| Agent description | `agents/{ceo,cpo,cto,cso,cbo,coo}/{c-level}.md` frontmatter | `v2.0: ...` / `v2.0+ Secondary` / `v2.0+ Primary` |
| Agent body | 동일 | `v2.0 모델` / `v2.0 통합 모델` / `v2.x 통합` |
| Skill phase router | `skills/vais/phases/{c-level}.md` description | `v2.0 Secondary` / `v2.0 Primary` / `v2.x` |
| Templates | `templates/*.template.md` | `v2.0+ CTO 전용` / `v2.0+: main.md = 인덱스` |
| 진입 가이드 | `CLAUDE.md`, `ONBOARDING.md`, `AGENTS.md` | `v2.0 모델` / `v2.x` 등 prose |
| Marketplace | `.claude-plugin/marketplace.json` description | `v2.0` 평문 |
| Sub-agent inline | 51 sub-agent 본문 (prose 중) | `v2.x` / `v2.0 모델` (block marker 외) |

### 치환 규칙

| Before | After | Note |
|--------|-------|------|
| `v2.0 모델` | (제거) | 문맥 그대로 두고 라벨만 빼기. "코드 개발 도우미" 식 평문 사용 |
| `v2.0 통합 모델` | (제거) | 동일 |
| `v2.x` | (제거 또는 `0.64.x`) | 평서문이면 제거 / 미래 minor 가리키면 `0.64.x` |
| `v2.0+ Secondary` | `Secondary` | 정체성만 남김 |
| `v2.0+ Primary` | `Primary` | 동일 |
| `v2.0+ CTO 전용` | `CTO 전용` | 동일 |
| `v2.0+: main.md = 인덱스` | `main.md = 인덱스` | 동일 |
| `v2.0:` (frontmatter description) | `0.64.0+:` | 명시 필요 시 plugin semver 사용 |

## 카테고리 B: KEEP (내부 asset 블록 버전)

component-local 버전. patch 스크립트가 의존. 사용자 노출 X (HTML 주석).

### 대상 (~58 파일)

| Asset | 마커 | 위치 |
|-------|------|------|
| subdoc-guard | `<!-- subdoc-guard version: v2.0 -->` | 정본 1 + 45 sub-agent inject = 46 |
| clevel-main-guard | `<!-- clevel-main-guard version: v2.0 -->` | 정본 1 + 6 C-Level inject = 7 |
| main-md template | `<!-- main-md template version: v2.0 -->` | `templates/main-md.template.md` 1 |

> **이유**: 이 마커들은 component-local 버전. plugin semver bump 시마다 같이 bump 안 함. patch 스크립트 (`lib/patch-block.js`) 가 버전 비교로 idempotent 동작 → 임의 변경 시 patch 동작 깨짐. 사용자 노출 X (HTML 주석으로 inject).
>
> **단, 카테고리 A 의 prose "v2.0 모델" 과 시각적 혼동 가능** → 카테고리 A 정리 후에는 "v2.0" 이 코드에 남아있는 곳 = component-local 마커만 → 의미 명확화.

## 카테고리 C: REPHRASE (코드 코멘트 + config 키)

내부 코드/설정. 사용자 직접 노출 X 이지만 contributor 읽음 → 의미 평문화 권장.

### 대상

| 파일 | 패턴 | 치환 |
|------|------|------|
| `lib/status.js` | `// v2.0 — role 별 mandatory phase` 코멘트 | `// 0.64.0+ — role 별 mandatory phase` 또는 `// role 별 mandatory phase (Primary/Secondary 정책)` |
| `lib/ceo-algorithm.js` | `// v2.x — 7 차원` | `// CEO 7 차원 알고리즘` |
| `scripts/auto-judge.js` | `// v2.0 분기` | `// Primary 자동 판정 / Secondary 명시 호출` |
| `scripts/cp-guard.js` | `v2.0 호환 정책` | `Primary/Secondary 정책 (4+2)` |
| `scripts/doc-validator.js` | `// v2.0` 코멘트 | 문맥 평문화 |
| `vais.config.json` | `_v2_routing_comment` / `_v2_was_*` 키 | `_routing_comment` / `_legacy_was_*` 로 rename |

### 치환 규칙

```
// v2.0 — {desc}     → // {desc} (Primary/Secondary 정책)
// v2.x — {desc}     → // {desc}
v2.0 호환 정책       → Primary/Secondary 정책
_v2_routing_comment  → _routing_comment
_v2_was_*            → _legacy_was_*
```

## 카테고리 D: HISTORICAL (KEEP intact)

박제된 PDCA 산출물. git 추적으로 시간 컨텍스트 보존.

### 대상

| 영역 | 파일 |
|------|------|
| 옛 피처 docs | `docs/simplify-non-cto-workflow/*` (13+ md) |
| 옛 피처 docs | `docs/ceo-judgment*/*` (있는 경우) |
| CHANGELOG | `CHANGELOG.md` 모든 [0.x.x] 엔트리 |

> **이유**: 박제 = 시점의 진실. 그때 "v2.0 모델" 라벨이 살아있었으므로 그대로 보존. 외부 사용자가 git log 따라 읽어도 컨텍스트 유지. 라벨 변경하면 이력 신뢰도 ↓.

## 자동화 가능성

| 카테고리 | 자동화 | 도구 |
|----------|:------:|------|
| A — agent description frontmatter | ✅ Node 스크립트 (line-targeted sed) | 단순 패턴 |
| A — template 헤더 | ✅ 동일 | 헤더 라인만 |
| A — sub-agent body prose | ⚠️ Mixed | grep + 수동 검토 (블록 마커와 거리 가까워 false positive 위험) |
| B | ❌ 자동화 X (KEEP) | — |
| C — 코드 코멘트 | ⚠️ Mixed | 수동 편집 권장 (의미 보존) |
| C — config 키 rename | ✅ Node 스크립트 | jq/Node JSON edit |
| D | ❌ 자동화 X (KEEP) | — |

## Success Criteria

| ID | Criterion | Verification |
|:--:|-----------|--------------|
| SC-01 | 카테고리 A 파일에서 "v2.0 모델" / "v2.x" 라벨 0건 | `grep -r "v2\.0 모델\|v2\.x" --include="*.md" --include="*.json"` (active code) = 0 |
| SC-02 | 카테고리 B 블록 마커 보존 (46 + 7 + 1 = 54건) | `grep -c "guard version: v2.0\|template version: v2.0"` = 54 |
| SC-03 | 카테고리 C — `vais.config.json` `_v2_*` → `_legacy_was_*` rename | grep `_v2_` = 0 |
| SC-04 | 카테고리 D — historical docs 변경 0건 | `git diff docs/simplify-non-cto-workflow/ docs/ceo-judgment*/ CHANGELOG.md` = empty |
| SC-05 | doc-validator passed | `node scripts/doc-validator.js` per-feature 통과 |
| SC-06 | vais-validate-plugin 0 errors | `node scripts/vais-validate-plugin.js` |
| SC-07 | patch script idempotent (블록 버전 KEEP 검증) | `node scripts/patch-subdoc-block.js --dry-run` → 동일 버전 스킵 45/45 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-03 | 79 파일 4 카테고리 분류 (~30 drop / ~58 keep / ~5 rephrase / ~14 historical). 치환 규칙 표 + Success Criteria 7건. 자동화 가능성 판정. |
