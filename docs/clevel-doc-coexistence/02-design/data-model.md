---
owner: cto
authors: []
topic: data-model
phase: design
feature: clevel-doc-coexistence
---

# clevel-doc-coexistence — design — data-model

> Topic: data-model | Owner: cto | Phase: design
> 참조: `./main.md`, `./architecture.md`, `./interface-contract.md`

## 1. `vais.config.json` 확장

### 1.1 `workflow.topicPresets` 스키마 v2

**v0.57 (v1) — 계속 지원**:
```json
"topicPresets": { "01-plan": ["requirements", "impact-analysis", "policy"] }
```

**v0.58 (v2) — 신규 지원**:
```json
"topicPresets": {
  "_schemaVersion": 2,
  "01-plan": {
    "_default": ["requirements", "impact-analysis", "policy"],
    "cbo": ["market-analysis", "gtm-plan", "unit-economics"],
    "cpo": ["requirements", "user-stories", "acceptance-criteria"],
    "cto": ["architecture-plan", "impact-analysis", "tech-risks"],
    "cso": ["security-requirements", "compliance-checklist"],
    "coo": ["deployment-plan", "monitoring-spec"]
  },
  "02-design": {
    "_default": ["architecture", "data-model", "api-contract", "ui-flow", "security"],
    "cbo": ["gtm-funnel", "pricing-tier", "financial-model"],
    "cto": ["architecture", "data-model", "api-contract"],
    "cso": ["threat-model", "security", "compliance"],
    "coo": ["deployment-architecture", "monitoring-design"]
  },
  "03-do": { "_default": ["implementation", "changes", "tests"] },
  "04-qa": { "_default": ["findings", "metrics", "issues"] },
  "05-report": { "_default": [] }
}
```

**Lookup 함수**:
```javascript
getTopicPreset(phase, cLevel) {
  const phaseNode = config.workflow.topicPresets[phaseFolder(phase)];
  if (Array.isArray(phaseNode)) return phaseNode;                   // v1 호환
  if (!phaseNode) return [];
  return phaseNode[cLevel] ?? phaseNode._default ?? [];             // v2
}
```

### 1.2 `workflow.cLevelCoexistencePolicy` 신규

| Key | Type | Default | 의미 |
|-----|------|---------|------|
| `enforcement` | `"warn"\|"retry"\|"fail"` | `"warn"` | v0.58 은 warn only |
| `mainMergeRule` | `"append-only"\|"diff-merge"` | `"append-only"` | D-Q1 |
| `sectionMarkerStyle` | `"heading"\|"html-comment"` | `"heading"` | `## [{C-LEVEL}]` |
| `ownerRequired` | boolean | `true` | topic frontmatter owner 필수 |
| `reentrySectionReplace` | boolean | `true` | D-Q5 |
| `reentryChangelogRequired` | boolean | `true` | D-Q5 |
| **`mainMdMaxLines`** | number | `200` | **F14** — main.md 라인 threshold |
| **`mainMdMaxLinesAction`** | `"warn"\|"refuse"` | `"warn"` | **F14** — v0.58 warn, v0.59+ refuse |

## 2. Topic 문서 frontmatter 스키마

```yaml
---
owner: cpo                   # enum: ceo|cpo|cto|cso|cbo|coo (필수)
authors:                     # string[] (선택, sub-agent slug)
  - prd-writer
  - ux-researcher
topic: requirements          # 파일 stem 과 일치 (필수)
phase: plan                  # ideation|plan|design|do|qa|report (필수)
feature: saas-time-tracker   # 선택
---
```

**Enum**: `owner ∈ {ceo, cpo, cto, cso, cbo, coo}`.
**파일명**: topic-first 엄수. `cpo-requirements.md` 금지(검사는 frontmatter 만).

## 3. `main.md` 섹션 구조 (v0.58)

| # | Heading | v0.57 | v0.58 추가 | 필수? |
|---|---------|:-----:|:----------:|:----:|
| 1 | `# {feature} — {NN-phase}` | Y | — | Y |
| 2 | `## Executive Summary` | Y | `Contributing C-Levels` 컬럼 | Y |
| 3 | `## Context Anchor` | Y | — | Y |
| 4 | `## Decision Record (multi-owner)` | Y | **Owner 컬럼 필수** | Y |
| 5 | `## [{C-LEVEL}] ...` | — | **신규** | owner ≥ 1 시 |
| 6 | `## Topic Documents` | Y | Owner 컬럼 권장 | topic ≥ 1 시 |
| 7 | `## Scratchpads` | Y | — | `_tmp/` ≥ 1 시 |
| 8 | `## Gate Metrics` | Y | — | Gate 있는 phase |
| 9 | `## 변경 이력` | Y | **재진입 entry 필수** | Y |

**§5 H2 포맷**: `## [{CBO|CPO|CTO|CSO|COO|CEO}] {도메인 요약}` (대괄호 + 대문자 C-Level).

**§9 재진입 entry 포맷**: `| vX.Y | YYYY-MM-DD | {ROLE} 재진입: {요약} |`.

## 4. `.vais/status.json` 스키마 확장

```json
"features": {
  "{feature}": {
    "subDocs": [ ... ],          // v0.57 그대로
    "topics": [                  // v0.58 신규
      {
        "phase": "plan",
        "topic": "requirements",
        "owner": "cpo",
        "authors": ["prd-writer", "ux-researcher"],
        "path": "docs/{feature}/01-plan/requirements.md",
        "registeredAt": "2026-04-21T..."
      }
    ],
    "mainDocSizes": {            // (F14) 선택적 캐시
      "plan": { "lines": 160, "measuredAt": "..." }
    }
  }
}
```

## 5. 경고 코드 레퍼런스 (전체)

| 코드 | v-버전 | Severity | Scope | 메시지 포맷 |
|------|:-----:|----------|-------|-------------|
| W-SCP-01 | v0.57 | warn | scratchpad | `Author 헤더 누락` |
| W-SCP-02 | v0.57 | warn | scratchpad | `Phase 헤더 누락` |
| W-SCP-03 | v0.57 | warn | scratchpad | `크기 < scratchpadMinBytes` |
| W-TPC-01 | v0.57 | warn | topic | `"## 큐레이션 기록" 섹션 누락` |
| W-IDX-01 | v0.57 | warn | main | `main.md 에 topic 링크 누락` |
| W-MAIN-01 | v0.57 | warn | main | `main.md 누락` |
| **W-OWN-01** | v0.58 | warn | topic | `owner frontmatter missing` |
| **W-OWN-02** | v0.58 | warn | topic | `invalid owner "{value}"` |
| **W-MRG-02** | v0.58 | warn | main | `Decision Record missing Owner column` |
| **W-MRG-03** | v0.58 | warn | main | `multi-owner topics present but no H2 owner section` |
| **W-MAIN-SIZE** | v0.58 (F14) | warn | main | `main.md {lines} lines exceeds mainMdMaxLines ({threshold}); consider topic split` |

## 6. 큐레이션 기록

| Source | 채택 | 거절 | 병합 | 추가 | 이유 |
|--------|:----:|:----:|:----:|:----:|------|
| design main.md v1.0 §3 | ✅ | | ✅ | | 데이터/스키마 이관 |
| F14 반영 (v1.1) | | | | ✅ | §1.2 `mainMdMaxLines`/`mainMdMaxLinesAction` 추가, §5 `W-MAIN-SIZE` 추가, §4 `mainDocSizes` 캐시 |

## 7. 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-20 | 초기 — 데이터/스키마 (main.md 에서 추출) |
| v1.1 | 2026-04-20 | F14 편입 — `mainMdMaxLines*` + `W-MAIN-SIZE` + `mainDocSizes` |
