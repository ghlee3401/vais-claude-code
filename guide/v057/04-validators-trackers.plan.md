# v0.57 Sub-plan 04 — Validators & Trackers Update

> 선행: 00, 01, 02
> 후행: 05
> 대상: `scripts/doc-validator.js`, `lib/status.js`, `scripts/auto-judge.js`, `lib/quality/gate-manager.js`

## 1. 목적

Sub-doc 컨벤션(00)과 C-Level 인덱스 포맷(01), sub-agent doc generation 규칙(02) 이 런타임에서 감지·추적되도록 검증·트래킹 도구를 업데이트. v0.57 정책은 **warn only** (enforcement 강화는 v0.58+).

## 2. 변경 파일

### 2.1 `scripts/doc-validator.js`

**현재 기능** (v0.56 기준 추정):
- `docs/{feature}/{NN-phase}/main.md` 존재 여부
- 템플릿 필수 섹션 헤더 카운트

**추가 기능**:

```javascript
// Pseudo-code

function validateSubDocs(feature, phase) {
  const phaseDir = `docs/${feature}/${phase}`;
  const mainPath = `${phaseDir}/main.md`;

  // 1. sub-doc 인벤토리
  const subDocs = glob(`${phaseDir}/*.md`).filter(p => !p.endsWith('/main.md'));

  // 2. 각 sub-doc 검증
  for (const doc of subDocs) {
    const content = fs.readFileSync(doc);

    // 2.1 메타 헤더 체크 (Author / Phase / Refs / Summary)
    const hasAuthor = /^> Author:/m.test(content);
    const hasPhase = /^> Phase:/m.test(content);
    if (!hasAuthor || !hasPhase) warn(`${doc}: 메타 헤더 누락`);

    // 2.2 슬러그 = 파일명 베이스 ↔ frontmatter.name 매칭 체크
    const slug = basename(doc, '.md').split('.')[0];
    // agents/*/*.md frontmatter 에서 name 찾고 매칭 (skill-validator 참조 가능)

    // 2.3 최소 크기 (빈 템플릿 스팸 방지): 1KB 이상 권장
    if (statSync(doc).size < 500) warn(`${doc}: 크기 500B 미만 — 템플릿 스캐폴드 의심`);

    // 2.4 필수 섹션 (Context / Body 또는 Decisions)
    const hasContext = /^## 1\. Context/m.test(content) || /^## 1\. 맥락/m.test(content);
    if (!hasContext) warn(`${doc}: Context 섹션 누락`);
  }

  // 3. main.md 에 sub-doc 링크 존재 여부
  if (fs.existsSync(mainPath)) {
    const mainContent = fs.readFileSync(mainPath);
    for (const doc of subDocs) {
      const name = basename(doc);
      if (!mainContent.includes(name)) {
        warn(`${mainPath}: ${name} 링크 없음 (Sub-documents 섹션에 추가 권장)`);
      }
    }
  }

  // 4. 예외 리스트 (시스템 산출물) — 슬러그 검증 skip
  const SYSTEM_ARTIFACTS = ['interface-contract.md'];
  // 위 2.2 체크 시 스킵
}
```

**출력 규칙**:
- enforcement=`warn`: stderr 로 경고, exit 0
- enforcement=`retry`: verdict=retry 반환
- enforcement=`fail`: exit 1

### 2.2 `lib/status.js`

`.vais/status.json` 스키마 확장:

```jsonc
{
  "features": {
    "{feature}": {
      "phase": "design",
      "docs": {
        "main": {
          "01-plan": { "path": "...", "updatedAt": "..." },
          "02-design": { "path": "...", "updatedAt": "..." }
        },
        "subDocs": [                              // 신규
          {
            "phase": "02-design",
            "agent": "ui-designer",
            "path": "docs/{feature}/02-design/ui-designer.md",
            "qualifier": null,
            "updatedAt": "2026-04-19T10:20:00Z",
            "size": 4523
          },
          {
            "phase": "02-design",
            "agent": "ui-designer",
            "path": "docs/{feature}/02-design/ui-designer.review.md",
            "qualifier": "review",
            "updatedAt": "2026-04-19T11:05:00Z",
            "size": 1892
          }
        ]
      },
      "gapAnalysis": { ... }
    }
  }
}
```

**신규 함수**:

```javascript
// lib/status.js 에 추가

function registerSubDoc({ feature, phase, agent, qualifier, path }) {
  const state = loadStatus();
  state.features ??= {};
  state.features[feature] ??= { docs: { subDocs: [] } };
  state.features[feature].docs.subDocs ??= [];

  const entry = {
    phase,
    agent,
    qualifier: qualifier ?? null,
    path,
    updatedAt: new Date().toISOString(),
    size: statSync(path).size,
  };

  // 덮어쓰기 (동일 agent + phase + qualifier)
  const existing = state.features[feature].docs.subDocs.findIndex(
    d => d.phase === phase && d.agent === agent && d.qualifier === (qualifier ?? null)
  );
  if (existing >= 0) state.features[feature].docs.subDocs[existing] = entry;
  else state.features[feature].docs.subDocs.push(entry);

  saveStatus(state);
}

function listSubDocs(feature, phase) {
  const state = loadStatus();
  return (state.features?.[feature]?.docs?.subDocs ?? [])
    .filter(d => !phase || d.phase === phase);
}
```

**호출 시점**:
- hooks/PostToolUse Write/Edit 훅에서 sub-doc 경로 감지 시 자동 호출 (기존 doc-tracker hook 확장 가능)
- 또는 doc-validator 실행 시 lazy 인벤토리 갱신

### 2.3 `scripts/auto-judge.js` + `lib/quality/gate-manager.js`

**현재** (v0.56.0~.2):
- 5 judge 함수가 main.md 만 파싱

**변경**:
- main.md 에서 `Critical: N`, `matchRate`, `score` 등을 **먼저** 시도
- main.md 에 없으면 sub-doc fallback (예: `04-qa/qa-engineer.md` → gap 분석 파싱)

```javascript
// scripts/auto-judge.js judgeCTO 예시

function judgeCTO(feature) {
  const mainPath = `docs/${feature}/04-qa/main.md`;
  const qaSubPath = `docs/${feature}/04-qa/qa-engineer.md`;

  let criticalIssueCount = parseMetric(mainPath, /Critical[:\s]*(\d+)/i);
  if (criticalIssueCount === null) {
    criticalIssueCount = parseMetric(qaSubPath, /Critical[:\s]*(\d+)/i);
  }

  const matchRate = getGapAnalysis(feature).matchRate;
  return { matchRate, criticalIssueCount };
}
```

**gate-manager.js**: 변경 없음 (입력만 auto-judge 가 보강).

### 2.4 hooks 업데이트 (선택)

`hooks/session-start.js` 에 sub-doc 인벤토리 resync 단계 추가 (저비용):

```javascript
// 세션 시작 시 docs/*/**/*.md 스캔 → .vais/status.json 에 registerSubDoc 호출
```

## 3. `vais.config.json` 스키마 반영

sub-plan 00 §3 에서 제안한 스키마 실제 반영:

```jsonc
{
  "workflow": {
    "docPaths": {
      "main": "docs/{feature}/{phase}/main.md",
      "subDoc": "docs/{feature}/{phase}/{slug}.md",
      "subDocQualified": "docs/{feature}/{phase}/{slug}.{qualifier}.md",
      "systemArtifacts": ["docs/{feature}/02-design/interface-contract.md"]
    },
    "subDocPolicy": {
      "enforcement": "warn",
      "autoIndex": true,
      "reportPhase": "single",
      "minSizeBytes": 500
    }
  }
}
```

## 4. 환경 변수

`VAIS_SUBDOC_MODE`:
- `off` — sub-doc 검증/트래킹 비활성
- `warn` (기본) — 경고만
- `strict` — enforcement=retry/fail 모드 지원 (v0.58+ 에서 활용)

## 5. 이벤트 로깅 (observability)

`lib/observability/event-logger.js` (v0.56 에서 활성) 에 신규 이벤트:

| Event | Payload |
|-------|---------|
| `subdoc.write` | `{ feature, phase, agent, qualifier, path, size }` |
| `subdoc.validate` | `{ feature, phase, warnings: [...] }` |
| `subdoc.missing-link` | `{ feature, phase, subDoc, mainMd }` (main.md 에 링크 없음) |

## 6. 성공 기준

| # | Criteria | 검증 |
|---|----------|------|
| SC-04-1 | `scripts/doc-validator.js` 가 sub-doc 경로/메타/크기/섹션 경고 생성 | 신규 테스트 `tests/doc-validator-subdoc.test.js` |
| SC-04-2 | `lib/status.js` 에 `registerSubDoc` / `listSubDocs` 함수 존재 | 테스트 `tests/status-subdoc.test.js` |
| SC-04-3 | `scripts/auto-judge.js` 가 main.md 우선 → sub-doc fallback 파싱 | 테스트 `tests/auto-judge-fallback.test.js` |
| SC-04-4 | `vais.config.json > workflow.subDocPolicy` 스키마 반영 + 기본값 `warn` | diff |
| SC-04-5 | `subdoc.write/validate/missing-link` 3 이벤트 로깅 | 테스트 |
| SC-04-6 | `VAIS_SUBDOC_MODE` 환경변수 3 모드 동작 | 테스트 |

## 7. 리스크

| 리스크 | 완화 |
|--------|------|
| 기존 피처 (v0.56 이전) 에서 sub-doc 없음 → 경고 폭발 | enforcement=warn. 또한 "main.md 단독" 은 경고 대상 아님. sub-doc 이 **있는데** main.md 링크 없는 경우만 경고 |
| doc-validator 에서 agents/\*/*.md frontmatter 파싱 성능 | 캐싱 (session 단위 `.vais/agent-slug-cache.json`) |
| status.json 비대화 | sub-doc entry 는 metadata only (본문 저장 X). 크기 무시할 수준 |

## 8. 비범위 (Not in scope)

- enforcement=`fail` 기본 활성화 (v0.58+ 로 이연)
- sub-doc 자동 생성 (템플릿 스캐폴드 `/vais scaffold-subdoc` 등) — 현재는 sub-agent 가 직접 작성
- Web 뷰어 통합 (dashboard.html 에 sub-doc 트리 렌더) — 선택 기능, 추후 검토

## 9. 다음

sub-plan 05 에서 테스트/문서/CHANGELOG/버전 동기화.
