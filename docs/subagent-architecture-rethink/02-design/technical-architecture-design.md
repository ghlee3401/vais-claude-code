---
owner: cto
topic: technical-architecture-design
phase: design
feature: subagent-architecture-rethink
authors: [infra-architect]
---

# Topic: Technical Architecture Design (CTO 큐레이션)

> Source: `_tmp/infra-architect.md` (~768 lines) → CTO 큐레이션. 8 모듈 인터페이스 + 의존성 그래프 + 10 agent frontmatter + 3 template 시범 + deprecate 정책.

## 1. lib/project-profile.js — 8 함수 모듈

```js
// 핵심 함수 시그니처

/** Profile yaml 파일 로드 + 보안 차단 */
function loadProfile(featurePath: string): ProjectProfile | null

/** schema validation (enum + boolean type + secret 차단) */
function validateProfile(profile: object): { valid: boolean, errors: string[] }

/** 정규식 기반 scope_conditions 평가 (CEL OUT — D-T5) */
function evaluateScopeConditions(conditions: string[], profile: ProjectProfile): boolean
//   지원 연산자: IN, NOT_IN, ==, !=, >=  (5개)
//   target_scale: rank 맵으로 순서 비교 (proto < pilot < sub-1k < 1k-100k < 100k+)

/** C-Level 진입 시 Context Load 마크다운 블록 */
function buildContextBlock(featurePath: string): string

/** feature flag */
function isProfileGateEnabled(): boolean
//   vais.config.json > orchestration.profileGateEnabled

/** 보조 함수 */
function loadProfileSchema(): ProfileSchema
function applyDefaults(profile: object): ProjectProfile
function detectSecrets(value: string): boolean  // G-1 보안 — high-entropy 패턴
```

**보안 (G-1)**: js-yaml `FAILSAFE_SCHEMA`만 사용 (임의 코드 실행 차단) + path traversal 차단 (`..`, 절대경로 거부) + secret 패턴 차단 (API key/token/password high-entropy 문자열).

**테스트 케이스 7개 (T-01~T-07)**:
| ID | 테스트 | 검증 |
|:--:|------|------|
| T-01 | `local-only` 프로파일 + ci-cd-configurator scope | skip 발동 |
| T-02 | `cloud + sla_required` + runbook-author scope | 실행 |
| T-03 | enum 위반 (`type: invalid-type`) | validateProfile errors |
| T-04 | bool 타입 위반 (`handles_pii: "yes"`) | validateProfile errors |
| T-05 | secret 입력 (`type: "sk-abc123..."`) | secret detect |
| T-06 | path traversal (`profile_path: ../../etc/passwd`) | reject |
| T-07 | scope 연산자 5개 (IN, NOT_IN, ==, !=, >=) | 모두 통과 |

## 2. hooks/ideation-guard.js — 수정 설계

기존 hook 구조 유지 + Profile 합의 부분 추가:

```
PostToolUse: Write
  ↓
target = 00-ideation/main.md?
  ↓ Yes
profile.yaml 미존재?
  ↓ Yes
extractProfileDraft(content, feature)
  - 12변수 자동 추출 (키워드 스캔 + 기본값)
  - additionalContext에 합의 안내 주입
```

**`extractProfileDraft(content: string, feature: string)`**: ideation main.md content에서 키워드 스캔 (예: "B2B SaaS" → `type: b2b-saas`, "MVP" → `stage: mvp`) → 12 변수 초안. 사용자가 명시 결정 후 yaml 저장.

## 3. scripts/template-validator.js + scripts/build-catalog.js

### template-validator CLI

```bash
node scripts/template-validator.js [path] [--depth-check]

# exit codes:
#   0 = pass
#   1 = schema error (frontmatter)
#   2 = depth error (--depth-check 시 sample/checklist/anti-pattern 미충족)
```

**검증 항목**:
- frontmatter `artifact`, `owner_agent`, `phase`, `canon_source`, `execution.policy` 존재
- `policy ∈ [always, scope, user-select, triggered]`
- `--depth-check`: `## (작성된 sample)` 100자+ + `## 작성 체크리스트` ≥5 항목 (`- [ ]` 카운트) + `## ⚠ Anti-pattern` ≥3 항목

### build-catalog 동작

```
gray-matter scan templates/*/*.md
  ↓ for each
templateToArtifact(frontmatter, path) — Artifact 객체 생성
  ↓ collect
catalog.json:
  - artifacts[]
  - by_phase: { core, why, what, how, biz }
  - by_policy: { always, scope, user-select, triggered }
  - by_intent: { business-model-design, market-analysis, prioritization, ... }
정렬: phase 순(core/why/what/how/biz) → policy 우선순위(A/B/C/D) → artifact id
```

**`--validate` 플래그**: build 전 template-validator 일괄 실행. 실패 시 catalog.json 미생성.

## 4. lib/auto-judge.js — alignment α

```js
function measureAlignmentAlpha(opts: {
  fromText: string,
  toText: string,
  fromPhase: string,
  toPhase: string,
  threshold?: number  // default 0.7
}): { score: number, passed: boolean, missingKeywords: string[] }

function extractKeywords(text: string): Set<string>
//   1. 코드블록/frontmatter 제거
//   2. 한국어 조사 제거 (을/를/이/가/은/는/...)
//   3. EN stopword 100개 필터
//   4. 명사구 추출 (대문자 시작 단어 + 복합명사)

function judge(opts: {
  type: 'designCompleteness' | 'alignment' | 'both'
  ...
}): JudgeResult
```

**v1**: 단순 recall (`|K_from ∩ K_to| / |K_from|`). EXP-4 측정 후 v2에서 단계 쌍별 가중치 추가 (예: Core→Why는 mission/vision 키워드 가중, Why→What은 persona/JTBD 키워드 가중).

## 5. 신규 sub-agent 10개 frontmatter spec

모든 신규 agent에 `artifacts:` 필드 표준 (D-IA-06).

### CEO 4개

```yaml
# vision-author.md
---
name: vision-author
description: Generates vision statements and BHAG (Big Hairy Audacious Goal) for product/company strategy. Use when CEO delegates Core-stage vision definition.
model: opus
agent-type: c-level-sub
tools: [Read, Write, Edit, Glob, Grep, TodoWrite]
artifacts: [vision-statement, bhag]
execution:
  policy: always
canon_source: "Collins 'Built to Last'"
---
```

같은 패턴으로:
- **strategy-kernel-author** — Diagnosis–Policy–Actions, `review_recommended: true`, Rumelt
- **okr-author** — Objective + Key Results, Doerr
- **pr-faq-author** — Working Backwards PR/FAQ, policy=user-select, Amazon

### CPO/What 1개

- **roadmap-author** — Now-Next-Later Roadmap, policy=always, ProductPlan

### COO 5개 (release-engineer 분해)

| Agent | policy | scope_conditions / trigger |
|-------|:------:|---------------------------|
| release-notes-writer | A | (모든 배포 필수) |
| ci-cd-configurator | B | `deployment.target IN [cloud,hybrid]` AND `users.target_scale != proto` |
| container-config-author | B | `deployment.target IN [cloud,hybrid,on-prem]` (D-IA-07 — 12변수 schema 최소화) |
| migration-planner | D | DB schema 변경 이벤트 |
| runbook-author | B | `deployment.sla_required=true` OR `users.target_scale ≥ 1k-100k` |

각 agent의 짧은 Role + 5~7 단계 Execution Flow는 `_tmp/infra-architect.md` 섹션 5 참조.

## 6. Template 3개 (c) 깊이 시범

infra-architect가 Core 5 중 가장 critical 3개 sample 작성 — 본 design phase에서 검증 가능한 형태:

### `templates/core/vision-statement.md`
- Collins BHAG 형식 (10~30년 단위 / 측정 가능한 단일 목표)
- Anti-pattern: Financial BHAG ($1B 매출 등) / 현재 상태 기술 / 단기 BHAG (3년 이내)

### `templates/core/strategy-kernel.md`
- Rumelt 3 단계 Kernel: Diagnosis (1단락) / Guiding Policy (2~3개) / Coherent Actions (5+)
- `review_recommended: true` (의사결정 비중 큼)
- Anti-pattern: Fluff+Wish (vision-only 전략) / 행동목록=전략 / 모든것우선 (선택 부재)

### `templates/core/okr.md`
- Grove + Doerr OKR (Objective 1개 + Key Results 3~5개) + Scoring 가이드 (0.0~1.0)
- Anti-pattern: Activity KR (행동 자체를 KR로) / 부드러운 KR (측정 불가) / O가 KR인 OKR

3개 모두 frontmatter D-D12 즉시 적용 3가지 (canon_source / review_recommended / project_context_reason) 포함.

## 7. 모듈 의존성 그래프

```mermaid
graph TD
  PP[lib/project-profile.js] --> Paths[lib/paths.js]
  PP --> FsU[lib/fs-utils.js]
  PP --> IO[lib/io.js]
  
  IG[hooks/ideation-guard.js] --> PP
  AJ[lib/auto-judge.js] --> PP
  AJ --> Paths
  
  TV[scripts/template-validator.js] --> GM[gray-matter]
  BC[scripts/build-catalog.js] --> GM
  BC --> TV
  
  CL[lib/c-level-context.js] --> PP
  
  PP --> JsYaml[js-yaml FAILSAFE]
  
  Catalog[catalog.json] -.생성-.> BC
  PP -.소비-.> Catalog
```

→ **순환 의존 없음**. 신규 의존성 2개만 (`js-yaml`, `gray-matter`).

## 8. release-engineer Deprecate 정책 (D-IA-08)

### v0.59 (현 피처 완료 시점)

```yaml
# agents/coo/release-engineer.md (수정)
---
deprecated: true
redirect_to: release-notes-writer  # 또는 적절한 신규 agent
deprecation_notice: |
  이 에이전트는 v0.59에서 5개 산출물 단위로 분해됐습니다:
  - release-notes-writer (Always)
  - ci-cd-configurator (Scope: cloud/hybrid)
  - container-config-author (Scope: cloud/hybrid/on-prem)
  - migration-planner (Triggered: DB schema 변경)
  - runbook-author (Scope: sla_required OR ≥1k users)
  v0.60에서 이 에이전트 자체는 제거됩니다. 새 에이전트로 마이그레이션해 주세요.
removal_target: v0.60
---
```

`scripts/agent-start.js`에 `DEPRECATED_AGENT_REDIRECTS` 맵 추가 — 호출 시 SubagentStart 훅에서 경고 + redirect 안내.

### v0.60 (다음 피처)

- agents/coo/release-engineer.md 파일 삭제
- vais.config.json `cSuite.coo.subAgents`에서 제거
- package.json `claude-plugin > agents`에서 제거
- CHANGELOG.md BREAKING CHANGE 명시

## 9. EXP 검증 준비도

| EXP | 준비 상태 | 결정 |
|:---:|---------|------|
| EXP-1 | ✅ T-01~T-07 (7 케이스) | Sprint 1~3 |
| EXP-2 | ✅ template-validator `--depth-check` 자동 | Sprint 4~6 |
| EXP-3 | ✅ Q-A/B/C/D 4기준 매트릭스 | Sprint 7~10 |
| EXP-4 | ⚠ v1 단순 recall, v2 가중치 후속 | Sprint 11 |
| EXP-5 | (CPO ux-researcher 위임) | Sprint 11~14 |

## 10. CTO 큐레이션 기록

| Source (`_tmp/infra-architect.md`) | 채택 | 거절 | 병합 | 추가 | 이유 |
|----|:----:|:----:|:----:|:----:|------|
| 8 함수 lib/project-profile.js | ✅ | | | | 명확 — 7 테스트 포함 |
| hooks/ideation-guard.js PostToolUse 훅 | ✅ | | | | 기존 패턴 준수 |
| template-validator + build-catalog CLI | ✅ | | | | exit code 0/1/2 |
| auto-judge alignment α v1 단순 recall | ✅ | | | | YAGNI — v2 후속 |
| 10 agent frontmatter spec | ✅ | | | | artifacts 필드 표준화 (D-IA-06) |
| 3 template 시범 (c) 깊이 | ✅ | | | | sample/checklist/anti-pattern 모두 |
| Mermaid 의존성 그래프 | ✅ | | | | 순환 없음 검증 |
| release-engineer v0.59→v0.60 | ✅ | | | | R4 완화 |
| **추가** D-IA-07 — container 변수 최소화 | | | | ✅ | Profile 12 schema 안정성 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 큐레이션 — _tmp/infra-architect.md(~768줄) 핵심 추출 |
