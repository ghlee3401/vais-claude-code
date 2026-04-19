# Interface Contract — v057-subdoc-preservation

> ⚙️ Gate 2 시스템 산출물 — CTO 가 Plan 데이터 모델 + Design 컴포넌트 설계를 합성하여 생성.
> 일반 sub-agent (backend-engineer / infra-architect 등) 가 **수정 금지**.
> 참조: `../01-plan/main.md` §데이터 모델 + §Impact Analysis, `./main.md` §3 데이터/스키마 설계

## Meta 피처 Contract 적용 방식

본 피처는 API/DB/UI 가 없는 **문서/프롬프트/설정 레이어 메타 피처**.
일반 Interface Contract 의 "API 엔드포인트 / 에러 코드 / 공통 응답" 대신:

1. **Configuration Contract** — `vais.config.json` 확장 키의 정확한 스키마
2. **Document Contract** — `main.md` / `{topic}.md` / `_tmp/{slug}.md` 정확한 섹션 헤딩
3. **Function Contract** — `lib/status.js` 신규 함수 시그니처
4. **Validation Contract** — `scripts/doc-validator.js` 경고 메시지 포맷

위 4개가 sub-agent 병렬 작업의 **동기화 기준**.

---

## 1. Configuration Contract (`vais.config.json`)

### 1.1 `workflow.docPaths` 확장

| Key | Value (literal) | Required |
|-----|-----------------|:--------:|
| `main` | `"docs/{feature}/{phase}/main.md"` | 기존 유지 |
| `topic` | `"docs/{feature}/{phase}/{topic}.md"` | 신규 (v0.57) |
| `scratchpad` | `"docs/{feature}/{phase}/_tmp/{slug}.md"` | 신규 (v0.57) |
| `scratchpadQualified` | `"docs/{feature}/{phase}/_tmp/{slug}.{qualifier}.md"` | 신규 (v0.57) |
| `systemArtifacts` | `["docs/{feature}/02-design/interface-contract.md"]` | 신규 (v0.57) |

### 1.2 `workflow.topicPresets` 신규

```json
{
  "00-ideation": ["problem", "hypotheses", "exit-criteria"],
  "01-plan":     ["requirements", "impact-analysis", "policy"],
  "02-design":   ["architecture", "data-model", "api-contract", "ui-flow", "security"],
  "03-do":       ["implementation", "changes", "tests"],
  "04-qa":       ["findings", "metrics", "issues"],
  "05-report":   []
}
```

### 1.3 `workflow.subDocPolicy` 신규

| Key | Type | Default | 의미 |
|-----|------|---------|------|
| `enforcement` | `"warn" \| "retry" \| "fail"` | `"warn"` | v0.57 은 warn only |
| `scratchpadPreserve` | boolean | `true` | `_tmp/` 영구 보존 (git 커밋 대상) |
| `scratchpadMinBytes` | number | `500` | 빈 스캐폴드 방지 |
| `requireCurationRecord` | boolean | `true` | topic 문서 "## 큐레이션 기록" 강제 |
| `reportPhase` | `"single" \| "multi"` | `"single"` | 05-report 는 main.md 단독 |

---

## 2. Document Contract

### 2.1 `main.md` 필수 섹션

| # | Heading | 필수 | 내용 |
|---|---------|:----:|------|
| 1 | `## Executive Summary` | Y | Problem/Solution/Effect/Core Value 표 |
| 2 | `## Context Anchor` | Y | WHY/WHO/RISK/SUCCESS/SCOPE 표 |
| 3 | `## Decision Record` | Y | 결정/대안/이유/근거 scratchpad 링크 |
| 4 | `## Topic Documents` | Y (topic 존재 시) | Topic 파일 인덱스 표 |
| 5 | `## Scratchpads` | Y (`_tmp/` 존재 시) | scratchpad 인벤토리 표 |
| 6 | `## Gate Metrics` | Gate 있는 phase 만 | matchRate / criticalIssueCount |
| 7 | `## 변경 이력` | Y | version/date/change 표 |

### 2.2 `{topic}.md` 필수 섹션

| # | Heading | 필수 | 내용 |
|---|---------|:----:|------|
| 1 | `# {feature} — {phase} — {topic}` 제목 | Y | |
| 2 | 본문 (C-Level 합성) | Y | topic 중심 서술 |
| 3 | `## 큐레이션 기록` | Y (enforcement=warn 시 경고) | §2.2 큐레이션 기록 포맷 |
| 4 | `## 변경 이력` | Y | |

### 2.3 `_tmp/{slug}.md` 필수 메타 헤더

```markdown
> Author: {agent-slug}
> Phase: {NN-phase}
> Refs: {상위 문서 경로 쉼표 구분}
```

**추가 권장**:
```markdown
> Summary: {한 줄 요약 — C-Level 이 main.md / topic 문서 작성 시 인용}
```

---

## 3. Function Contract (`lib/status.js`)

### 3.1 `registerSubDoc(entry)`

```typescript
function registerSubDoc(entry: {
  feature: string;              // kebab-case
  phase: '00-ideation' | '01-plan' | '02-design' | '03-do' | '04-qa' | '05-report';
  kind: 'scratchpad' | 'topic';
  agent?: string | null;        // scratchpad 면 필수, topic 이면 null
  qualifier?: string | null;    // scratchpad 복수 산출물
  topic?: string | null;        // kind=topic 이면 필수
  path: string;                 // 절대/상대 경로
}): void
```

**동작**:
1. `.vais/status.json` 로드 (없으면 빈 객체로 초기화)
2. `features[feature].docs.subDocs[]` 에 entry 추가 (복합키로 기존 덮어쓰기)
3. `fs.statSync(path).size` 자동 계산하여 entry.size 채움
4. `entry.updatedAt = new Date().toISOString()`
5. 원자적 쓰기 (tmp + rename, 기존 lib/io 패턴)

### 3.2 `listSubDocs(feature, filter?)`

```typescript
function listSubDocs(
  feature: string,
  filter?: { phase?: string; kind?: 'scratchpad' | 'topic' }
): SubDocEntry[]
```

### 3.3 `unregisterSubDoc(key)`

```typescript
function unregisterSubDoc(key: {
  feature: string;
  phase: string;
  kind: 'scratchpad' | 'topic';
  agent?: string | null;
  qualifier?: string | null;
  topic?: string | null;
}): boolean   // 제거 성공 여부
```

---

## 4. Validation Contract (`scripts/doc-validator.js`)

### 4.1 경고 메시지 포맷 (고정)

| Warning Code | Template | 트리거 |
|--------------|----------|--------|
| `W-SCP-01` | `{path}: Author 헤더 누락` | `> Author:` 없음 |
| `W-SCP-02` | `{path}: Phase 헤더 누락` | `> Phase:` 없음 |
| `W-SCP-03` | `{path}: 크기 {N}B 미만 — 빈 스캐폴드 의심` | size < `scratchpadMinBytes` |
| `W-TPC-01` | `{path}: 큐레이션 기록 섹션 누락` | `## 큐레이션 기록` 헤딩 없음 |
| `W-IDX-01` | `{main}: {topic} 링크 누락 (Topic Documents 섹션에 추가 권장)` | main.md 에 topic 링크 없음 |
| `W-MAIN-01` | `{dir}: main.md 누락` | 기존 경고 유지 |

### 4.2 exit code 정책

| `subDocPolicy.enforcement` | warn 없을 때 | warn 있을 때 |
|---------------------------|:------------:|:------------:|
| `warn` | 0 | 0 (stderr 출력) |
| `retry` | 0 | 0 + `retry` verdict 반환 |
| `fail` | 0 | 1 |

v0.57 기본값 = `warn`. `retry`/`fail` 은 스키마만 정의, 실제 구현은 v0.58+.

---

## 5. Observability Contract

### 5.1 신규 이벤트 (`lib/observability/event-logger.js`)

| Event name | Payload |
|------------|---------|
| `subdoc.write` | `{ feature, phase, kind, agent?, topic?, qualifier?, path, size }` |
| `subdoc.validate` | `{ feature, phase, warningCount, warnings: [...] }` |
| `subdoc.missing-link` | `{ feature, phase, mainPath, topicFile }` |

### 5.2 VAIS_SUBDOC_MODE 환경변수

| Value | 동작 |
|-------|------|
| `off` | 검증/트래킹 비활성 |
| `warn` (기본) | 경고만 |
| `strict` | `retry` / `fail` enforcement 활용 (v0.58+) |

---

## 6. 병렬 에이전트 쓰기 보장 (Concurrency Contract)

| 시나리오 | 규칙 |
|----------|------|
| Do phase frontend+backend+test-engineer 병렬 | 각자 `_tmp/{slug}.md` Write. main.md 는 CTO 가 수집 후 단독 Write |
| Design phase ui-designer + infra-architect 병렬 | 각자 `_tmp/{slug}.md` Write. main.md + interface-contract.md 는 CTO 단독 |
| CSO auditor 다수 병렬 | 각자 `_tmp/{slug}.md` Write. CSO 가 main.md + topic 문서 합성 |
| 동일 agent 복수 호출 | qualifier 로 파일 분리 (`{slug}.v2.md`) |

---

## 7. Gate 2 통과 조건 (CTO plan.md Gate 2)

- [x] 모든 변경 대상 컴포넌트 명세 — Design §2
- [x] 디자인 토큰 참조 — N/A (문서 레이어)
- [x] 네비게이션 플로우 — Design §1.1 (문서 레이어 IA)
- [x] 에러·로딩·빈 상태 — 본 Contract §4.1 경고 코드
- [x] Interface Contract 생성 — 본 파일

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-19 | Gate 2 생성 — Meta 피처 특화 4개 Contract (Configuration/Document/Function/Validation) + Observability + Concurrency |
