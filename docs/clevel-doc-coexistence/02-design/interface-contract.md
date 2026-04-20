# Interface Contract — clevel-doc-coexistence

> ⚙️ Gate 2 시스템 산출물 — CTO 가 Plan 데이터 모델 + Design 결정을 합성하여 생성.
> 일반 sub-agent 가 **수정 금지**. 참조: `../01-plan/main.md` §F1-F13, `./main.md` §3/§4
> 본 피처는 API/DB/UI 가 없는 **문서/프롬프트/설정 메타 피처** (v0.57 선례와 동일 구조).

## Meta 피처 Contract 구성

| # | Contract | 역할 |
|---|----------|------|
| 1 | Configuration | `vais.config.json` 확장 키 스키마 |
| 2 | Document | `main.md` H2 섹션 + `{topic}.md` frontmatter |
| 3 | Function | `lib/status.js` 신규 함수 시그니처 |
| 4 | Validation | `scripts/doc-validator.js` 경고 메시지 포맷 |

위 4개는 Do Batch A/B/C 의 **동기화 기준**. 수정은 CTO 만.

---

## 1. Configuration Contract (`vais.config.json`)

### 1.1 `workflow.topicPresets` 스키마 v2

**v0.57 (v1) 형식 — 계속 지원**:
```json
"topicPresets": {
  "01-plan": ["requirements", "impact-analysis", "policy"]
}
```

**v0.58 (v2) 형식 — 신규 지원**:
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
  }
}
```

**Lookup 함수** (lib/paths.js 또는 lib/status.js):
```javascript
getTopicPreset(phase, cLevel) {
  const phaseNode = config.workflow.topicPresets[phaseFolder(phase)];
  if (Array.isArray(phaseNode)) return phaseNode;          // v1 호환
  if (!phaseNode) return [];
  return phaseNode[cLevel] ?? phaseNode._default ?? [];     // v2
}
```

### 1.2 `workflow.cLevelCoexistencePolicy` 신규

| Key | Type | Default | 의미 |
|-----|------|---------|------|
| `enforcement` | `"warn" \| "retry" \| "fail"` | `"warn"` | v0.58 은 warn only |
| `mainMergeRule` | `"append-only" \| "diff-merge"` | `"append-only"` | D-Q1 — v0.58 은 append-only |
| `sectionMarkerStyle` | `"heading" \| "html-comment"` | `"heading"` | `## [{C-LEVEL}]` 헤딩 방식 |
| `ownerRequired` | boolean | `true` | topic.md frontmatter owner 필수 |
| `reentrySectionReplace` | boolean | `true` | D-Q5 — 재진입 시 자기 섹션 교체 허용 |
| `reentryChangelogRequired` | boolean | `true` | D-Q5 — 재진입 시 변경 이력 entry 필수 |
| `mainMdMaxLines` | number | `200` | **F14** — D-Q7 — main.md 라인 threshold |
| `mainMdMaxLinesAction` | `"warn" \| "refuse"` | `"warn"` | **F14** — v0.58 warn, v0.59+ refuse |

---

## 2. Document Contract

### 2.1 `main.md` 필수 섹션 (v0.58 확장)

| # | Heading | v0.57 | v0.58 추가 | 내용 |
|---|---------|:-----:|:----------:|------|
| 1 | `# {feature} — {NN-phase}` | Y | | 제목 |
| 2 | `## Executive Summary` | Y | `Contributing C-Levels` 컬럼 | 공통 |
| 3 | `## Context Anchor` | Y | | 공통 |
| 4 | `## Decision Record` | Y | **`Owner` 컬럼 필수** | multi-owner 지원 |
| 5 | `## [{C-LEVEL}] ...` | — | **신규** | 각 owner H2 섹션 (0..N 개) |
| 6 | `## Topic Documents` | Y | `Owner` 컬럼 필수 | 인덱스 |
| 7 | `## Scratchpads` | Y | | v0.57 호환 |
| 8 | `## Gate Metrics` | Y | | 해당 phase |
| 9 | `## 변경 이력` | Y | **재진입 entry 필수** | D-Q5 |

**§5 H2 섹션 포맷**:
```markdown
## [{CBO|CPO|CTO|CSO|COO|CEO}] {도메인 요약}
(1~5 단락 요약. 상세는 {topic}.md 참조. 해당 C-Level 이 기여한 topic 문서 링크 포함)
```

### 2.2 `{topic}.md` frontmatter 필수 키

```yaml
---
owner: cpo             # enum, 필수
authors: [prd-writer]  # string[], 선택
topic: requirements    # 필수, 파일 stem
phase: plan            # 필수, phase 이름(폴더 번호 아님)
feature: saas-time-tracker  # 선택
---
```

**Enum**: `owner ∈ {ceo, cpo, cto, cso, cbo, coo}`.

**파일명 규칙**: topic-first (`requirements.md`). `cpo-requirements.md` 형태 **금지** (doc-validator 는 파일명 검사 안 하고 frontmatter 만 검사).

### 2.3 재진입 시 `## 변경 이력` entry 포맷

```markdown
| v1.2 | 2026-04-21 | CPO 재진입: acceptance-criteria 3건 추가, user-stories.md v2 |
```

- `{role} 재진입:` 프리픽스로 시작
- 변경 요약 1줄

---

## 3. Function Contract (`lib/status.js`)

### 3.1 신규 함수 시그니처

```javascript
/**
 * Topic 문서 등록.
 * @param {string} feature
 * @param {string} phase        - 'ideation'|'plan'|'design'|'do'|'qa'|'report'
 * @param {string} topic        - kebab-case
 * @param {object} meta
 * @param {string} meta.owner   - 'ceo'|'cpo'|'cto'|'cso'|'cbo'|'coo'
 * @param {string[]} [meta.authors]
 * @returns {object}  { topic, owner, authors, path, registeredAt }
 * @throws InvalidFeatureName | InvalidOwner
 */
function registerTopic(feature, phase, topic, meta) { ... }

/**
 * @param {string} feature
 * @param {string} [phase]  생략 시 전 phase
 * @returns {Array<{ phase, topic, owner, authors, path, registeredAt }>}
 */
function listFeatureTopics(feature, phase) { ... }

/**
 * D-Q3 helper — _tmp/ 스캔
 * @returns {Array<{ slug, path, summary, size }>}
 */
function listScratchpadAuthors(feature, phase) { ... }

/**
 * @returns {{ ceo: boolean, cpo: boolean, cto: boolean, cso: boolean, cbo: boolean, coo: boolean }}
 */
function getOwnerSectionPresence(feature, phase) { ... }

/**
 * D-Q6 인터페이스 (구현은 v0.58.1)
 * @returns {Array<{ topic, owner, path }>}
 */
function getFeatureTopics(feature, phase) { ... }

/**
 * (F14) main.md 라인 수 측정 — W-MAIN-SIZE 판정용
 * @param {string} feature
 * @param {string} phase       - 'ideation'|'plan'|'design'|'do'|'qa'|'report'
 * @returns {{ path: string, lines: number, bytes: number, exists: boolean }}
 */
function getMainDocSize(feature, phase) { ... }
```

### 3.2 `.vais/status.json` 스키마 확장

```json
"features": {
  "{feature}": {
    "subDocs": [...],             // v0.57 그대로
    "topics": [                   // v0.58 신규
      {
        "phase": "plan",
        "topic": "requirements",
        "owner": "cpo",
        "authors": ["prd-writer", "ux-researcher"],
        "path": "docs/{feature}/01-plan/requirements.md",
        "registeredAt": "2026-04-21T..."
      }
    ]
  }
}
```

---

## 4. Validation Contract (`scripts/doc-validator.js`)

### 4.1 신규 경고 코드 (v0.58)

| Code | Severity | Scope | 탐지 조건 | 메시지 포맷 |
|------|----------|-------|-----------|-------------|
| `W-OWN-01` | warn | topic.md | frontmatter 에 `owner` 키 없음 | `{path}: owner frontmatter missing` |
| `W-OWN-02` | warn | topic.md | owner ∉ C-Level enum | `{path}: invalid owner "{value}"` |
| `W-MRG-02` | warn | main.md | Decision Record 표 헤더에 `Owner` 컬럼 없음 | `{path}: Decision Record missing Owner column` |
| `W-MRG-03` | warn | main.md | `## [{X}]` 섹션 0개 AND topics ≥ 2 | `{path}: multi-owner topics present but no H2 owner section found` |
| **`W-MAIN-SIZE`** | warn | main.md | **(F14)** 라인 수 > `mainMdMaxLines` AND topic 0 AND `_tmp/` 0 | `{path}: main.md {lines} lines exceeds mainMdMaxLines ({threshold}); consider topic split` |

(v0.58 범위 밖: `W-MRG-01` — git 이력 기반 섹션 삭제 감지)

### 4.2 JSON 출력 확장

```json
{
  "passed": true,
  "missing": [],
  "warnings": [],
  "subDocWarnings": [],
  "coexistenceWarnings": [          // v0.58 신규
    { "code": "W-OWN-01", "path": "...", "message": "..." }
  ]
}
```

### 4.3 CLI exit code

`enforcement=warn` 이면 exit 0 유지(경고만 출력). `retry`/`fail` 은 v0.59+ 에서 매핑.

---

## 5. Build-time Contract (`scripts/patch-clevel-guard.js`)

### 5.1 입력/출력

- **입력**: `agents/_shared/clevel-main-guard.md` 본문 (frontmatter 제외), 버전 마커
- **대상**: `agents/{ceo,cpo,cto,cso,cbo,coo}/{role}.md` 6 파일
- **출력**: 각 agent md 에 다음 블록 삽입/갱신
  ```markdown
  <!-- clevel-main-guard begin vX.Y.Z -->
  ... (canonical 본문)
  <!-- clevel-main-guard end -->
  ```
- **Idempotent**: 이미 존재하고 버전 동일하면 no-op. 버전 다르면 교체.

### 5.2 삽입 위치

`<!-- subdoc-guard end -->` 마커 **직후**. subdoc-guard 가 없으면 파일 끝에 append.

---

## 6. v0.57 호환 보증

| v0.57 항목 | v0.58 처리 |
|-----------|-----------|
| `workflow.docPaths.topic` | 무변경 |
| `workflow.docPaths.scratchpad` | 무변경 |
| `workflow.subDocPolicy` | 무변경 — `cLevelCoexistencePolicy` 는 별도 정책 키 |
| `subDocs[]` status.json | 무변경 — `topics[]` 는 별도 |
| `agents/_shared/subdoc-guard.md` | 무변경 — canonical 유지 |
| `templates/subdoc.template.md` | 무변경 |
| `W-SCP-01/02/03`, `W-TPC-01`, `W-IDX-01`, `W-MAIN-01` | 무변경 |
| 기존 v0.57 피처 (`v057-subdoc-preservation`) | 무변경 — 마이그레이션 스킵 |

**호환성 회귀 가드**: `tests/paths.test.js` 와 `tests/v057-compat.test.js` (신규) 가 v0.57 경로·함수·경고 코드 문자열 검증.

---

## 7. 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-20 | Gate 2 초기 — 4 Contract + v0.57 호환 보증 |
| v1.1 | 2026-04-20 | **F14 편입** — §1.2 에 `mainMdMaxLines`/`mainMdMaxLinesAction` 2행 추가, §3.1 에 `getMainDocSize` 시그니처 추가, §4.1 에 `W-MAIN-SIZE` 경고 추가 |
