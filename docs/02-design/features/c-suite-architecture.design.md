# Design: vais v2 — C-Suite 플랫폼 아키텍처

> 선택 아키텍처: **Option B — Clean Architecture**
> Plan 문서: `docs/01-plan/features/c-suite-architecture.plan.md`
> 작성일: 2026-03-31 / 최종 수정: 2026-04-01 (v3.3 Plan 반영)

---

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | 배포용 플러그인 + Paperclip 스타일 대시보드까지 확장 예정. 지금 구조로 붙이면 나중에 전부 재설계 필요 |
| WHO | vais-code 플러그인 배포자, 설치 사용자, 대시보드 UI 소비자 |
| RISK | 레이어 과설계로 초기 복잡도 증가. MCP 서버 추가 의존성. 대시보드는 별도 레포 필요 |
| SUCCESS | SC-01: 6-레이어 경계 명확 분리. SC-02: C-Suite 에이전트 독립 추가/제거. SC-03: event-log.jsonl 기록. SC-04: MCP 상태 외부 노출. SC-05: 기존 체이닝 완전 호환 |
| SCOPE | Phase 1 (코어 재구성): observability 모듈 + CTO 에이전트 + 훅 + 플러그인 배포 메타데이터 |

---

## 1. Overview

### 1.1 설계 목표

vais v2 Phase 1은 다음 세 가지를 동시에 달성합니다:

1. **CTO 에이전트로 교체**: `manager.md` → `agents/cto.md` (기능 동일, 이름 변경)
2. **Observability Layer 구축**: 에이전트 상태 + 이벤트 로그를 기록하는 클린 모듈
3. **플러그인 배포 준비**: `package.json` Claude plugin 메타데이터 추가

이 세 가지가 완료되면 Phase 2 (C-Suite 에이전트 추가)와 Phase 3 (MCP 서버)는 각각 독립적으로 진행 가능합니다.

### 1.2 아키텍처 선택 이유 (Option B)

Option B를 선택한 이유:
- `lib/observability/` 모듈이 단일 책임: 상태 관리와 이벤트 기록만
- Phase 3 MCP 서버가 이 모듈을 직접 import할 수 있음
- `schema.js`로 이벤트 타입을 중앙 관리 → 대시보드/MCP 서버 모두 같은 스키마 사용
- 로그 로테이션이 `rotation.js`로 분리 → 테스트 및 교체 가능

---

## 2. 모듈 설계

### 2.1 lib/observability/ — 핵심 모듈

```
lib/observability/
├── index.js          ← StateWriter + EventLogger export
├── state-writer.js   ← StateWriter 클래스
├── event-logger.js   ← EventLogger 클래스
├── schema.js         ← 이벤트 타입 상수 + 스키마
└── rotation.js       ← 로그 로테이션 유틸
```

#### StateWriter 클래스 (`lib/observability/state-writer.js`)

```javascript
class StateWriter {
  constructor(stateFilePath)

  // 에이전트 시작 기록
  markAgentStart(role, phase, taskDescription)

  // 에이전트 완료/실패 기록
  markAgentStop(role, outcome, outputDoc)

  // 파이프라인 큐 업데이트
  updatePipeline(current, queue, completed)

  // 현재 상태 읽기
  read()

  // 상태 초기화 (새 세션 시작)
  reset(feature, cSuiteRoles)
}
```

**관리하는 파일**: `.vais/agent-state.json`

```json
{
  "session": "ISO8601",
  "feature": "login",
  "active_agents": [
    {
      "role": "cto",
      "status": "running",
      "phase": "plan",
      "started_at": "ISO8601",
      "current_task": "데이터 모델 정의 중"
    }
  ],
  "completed_agents": ["ceo"],
  "pipeline": {
    "current": "cto",
    "queue": ["design", "frontend", "backend", "qa"],
    "completed": ["ceo"]
  }
}
```

#### EventLogger 클래스 (`lib/observability/event-logger.js`)

```javascript
class EventLogger {
  constructor(logFilePath, rotationConfig)

  // 이벤트 기록 (append-only)
  log(eventType, payload)

  // 필터링 조회 (MCP 서버에서 사용)
  query({ role, eventType, since, limit })

  // decision 이벤트만 조회
  queryDecisions(feature)

  // 현재 로그 파일 경로
  get currentLogPath()
}
```

**관리하는 파일**: `.vais/event-log.jsonl` (append-only JSONL)

```jsonl
{"ts":"ISO8601","event":"session_start","feature":"login","c_suite":["ceo","cto"]}
{"ts":"ISO8601","event":"agent_start","role":"cto","phase":"plan"}
{"ts":"ISO8601","event":"decision","role":"cto","type":"architecture","choice":"nextjs+supabase","rationale":"팀 경험"}
{"ts":"ISO8601","event":"gate_check","gate":1,"result":"pass","items":4}
{"ts":"ISO8601","event":"agent_stop","role":"cto","outcome":"success","doc":"docs/01-plan/login.md"}
```

#### 이벤트 스키마 (`lib/observability/schema.js`)

```javascript
// 이벤트 타입 상수
export const EVENT_TYPES = {
  SESSION_START:    'session_start',
  SESSION_END:      'session_end',
  AGENT_START:      'agent_start',
  AGENT_STOP:       'agent_stop',
  PHASE_TRANSITION: 'phase_transition',
  GATE_CHECK:       'gate_check',
  DECISION:         'decision',
  ERROR:            'error',
}

// 각 이벤트 타입별 필수 payload 필드
export const EVENT_SCHEMAS = {
  agent_start:      { required: ['role', 'phase'] },
  agent_stop:       { required: ['role', 'outcome'] },
  phase_transition: { required: ['from', 'to', 'feature'] },
  gate_check:       { required: ['gate', 'result'] },
  decision:         { required: ['role', 'type', 'choice'] },
}
```

#### 로그 로테이션 (`lib/observability/rotation.js`)

```javascript
// 설정값
const DEFAULT_CONFIG = {
  maxSizeMB: 10,
  rotateAfterDays: 30,
  archivePath: '.vais/archive/'
}

export function shouldRotate(logPath, config)
export function rotate(logPath, config)   // 날짜 접미사로 아카이브
```

### 2.2 scripts/ — Hook 호출 스크립트

Hook에서 직접 호출되는 얇은 CLI 래퍼. 로직은 `lib/observability/`에 위임.

#### agent-start.js

```javascript
// 사용: node scripts/agent-start.js <role> <phase> [task]
// SubagentStart 훅에서 호출
import { StateWriter, EventLogger } from '../lib/observability/index.js'

const [role, phase, task = ''] = process.argv.slice(2)
const sw = new StateWriter('.vais/agent-state.json')
const el = new EventLogger('.vais/event-log.jsonl')

sw.markAgentStart(role, phase, task)
el.log('agent_start', { role, phase, task })
```

#### agent-stop.js

```javascript
// 사용: node scripts/agent-stop.js <role> <outcome> [outputDoc]
// SubagentStop 훅에서 호출
const [role, outcome, outputDoc = ''] = process.argv.slice(2)

sw.markAgentStop(role, outcome, outputDoc)
el.log('agent_stop', { role, outcome, doc: outputDoc })
```

#### phase-transition.js

```javascript
// 사용: node scripts/phase-transition.js <from> <to> <feature>
// PhaseTransition 훅에서 호출 (cto.md 내부에서 호출)
const [from, to, feature] = process.argv.slice(2)

el.log('phase_transition', { from, to, feature })
```

### 2.3 hooks/settings.json — CC 훅 설정

```json
{
  "hooks": {
    "SubagentStart": [
      {
        "type": "command",
        "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/agent-start.js ${AGENT_NAME} ${PHASE:-unknown}",
        "timeout": 5000
      }
    ],
    "SubagentStop": [
      {
        "type": "command",
        "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/agent-stop.js ${AGENT_NAME} ${OUTCOME:-success}",
        "timeout": 5000
      }
    ]
  }
}
```

> **주의**: CC의 환경 변수 주입 방식은 버전마다 다를 수 있음. agent-start.js는 환경 변수 없이도 gracefully 실행되어야 함.

### 2.4 hooks/events.json — 이벤트 스키마 문서

```json
{
  "version": "2.0.0",
  "events": {
    "session_start":    { "description": "새 피처 개발 세션 시작", "payload": ["feature", "c_suite"] },
    "agent_start":      { "description": "에이전트 실행 시작", "payload": ["role", "phase", "task"] },
    "agent_stop":       { "description": "에이전트 완료/실패", "payload": ["role", "outcome", "doc"] },
    "phase_transition": { "description": "단계 전환 (plan→design 등)", "payload": ["from", "to", "feature"] },
    "gate_check":       { "description": "Gate 판정", "payload": ["gate", "result", "items"] },
    "decision":         { "description": "C-Suite 결정 기록", "payload": ["role", "type", "choice", "rationale"] },
    "error":            { "description": "에러 발생", "payload": ["role", "code", "message"] }
  }
}
```

---

## 3. 에이전트 설계

### 3.1 agents/cto.md — manager 대체

**변경 범위**: `agents/manager.md`의 내용 전부 이전 + 다음 추가:

```yaml
---
name: cto
version: 2.0.0
description: |
  CTO. 기술 방향 설정 + 전체 오케스트레이션.
  manager의 모든 역할을 수행합니다.
  Triggers: cto, technical planning, architecture, 기술 계획, 아키텍처
model: opus
tools: [Read, Write, Edit, Glob, Grep, Bash, Agent, TodoWrite, AskUserQuestion]
memory: project
hooks:
  Stop:
    - type: command
      command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/agent-stop.js cto success"
      timeout: 5000
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
  - "Bash(git reset --hard*)"
---
```

본문: `manager.md` 전체 + 아래 섹션 추가:

```markdown
## Phase Transition 기록

단계 전환 시 반드시 호출:
```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/phase-transition.js {from} {to} {feature}
```

예: plan → design 전환 시:
```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/phase-transition.js plan design login
```
```

### 3.2 agents/manager.md — Deprecated 라우팅

기존 파일을 다음으로 교체:

```markdown
---
name: manager
description: |
  ⚠️ DEPRECATED: manager는 cto로 대체되었습니다.
  이 에이전트는 cto.md로 자동 라우팅합니다.
  v2.0.0부터 사용 중단. v3.0.0에서 제거 예정.
model: opus
---

# ⚠️ Deprecated

이 에이전트는 `cto`로 대체되었습니다.

`/vais manager {feature}` 명령은 자동으로 `/vais cto {feature}`로 처리됩니다.

다음 중 하나를 사용하세요:
- `/vais cto {feature}` — 신규 권장
- `/vais ceo:cto {feature}` — 비즈니스 방향 포함 시

[→ CTO 에이전트 문서](./cto.md)
```

### 3.3 skills/vais/phases/cto.md

`skills/vais/phases/manager.md` (현재 없으면 plan.md 내 manager 섹션)를 분리.

CTO 역할 전용 지침 파일:
```markdown
# CTO Phase Guide

CTO는 Plan 단계를 직접 실행하고 전체 에이전트를 오케스트레이션합니다.

## 시작 시 수행
1. .vais/memory.json 관련 엔트리 로드
2. .vais/status.json 확인
3. 의도 분류 (신규/수정/확장)

## 완료 시 수행
1. phase-transition.js 호출
2. Gate 판정
3. AskUserQuestion으로 사용자 확인

[... manager.md의 역할 지침 전체 ...]
```

---

## 3-B. Phase 2 — C-Suite 에이전트 설계

### 3-B.1 C-Suite 에이전트 표준 인터페이스

모든 C-Suite 에이전트는 동일한 frontmatter 구조를 따름 (vais.config.json의 roles 정의와 1:1 매핑):

```yaml
---
name: {role}           # ceo / cmo / cso / ...
version: 1.0.0
description: |
  {역할 설명}
  Triggers: {role}, {keywords}
model: opus | sonnet   # vais.config.json roles.{role}.model과 동일
tools: [Read, Write, Edit, Glob, Grep, Bash, Agent, TodoWrite, AskUserQuestion]
memory: project
hooks:
  Stop:
    - type: command
      command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/agent-stop.js {role} success"
      timeout: 5000
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push --force*)"
---
```

각 역할에 대응하는 skill phase 파일: `skills/vais/phases/{role}.md`

### 3-B.2 CMO — SEO 통합 설계

**CMO 역할 확장**: 기존 `vais-seo` 스킬을 CMO 산출물에 흡수.

```
agents/cmo.md           ← CMO 에이전트 정의
skills/vais/phases/cmo.md  ← CMO 워크플로우 지침
```

CMO가 실행하는 작업 순서:
```
1. 마케팅 방향 분석 (기존 vais-seo 역할 수행 전 컨텍스트 설정)
2. SEO 감사 실행 (기존 vais-seo SKILL.md 로직 내장)
   - Title/Meta 검사
   - Semantic HTML 체크
   - Core Web Vitals 가이드
3. 산출물 생성:
   - docs/05-marketing/{f}.md          ← 마케팅 콘텐츠 전략
   - docs/05-marketing/{f}-seo.md      ← SEO 감사 리포트
```

`skills/vais-seo/SKILL.md` → deprecated redirect:
```markdown
---
name: vais-seo
description: ⚠️ DEPRECATED: CMO 에이전트로 통합됨
---
SEO 감사는 CMO가 담당합니다. `/vais cmo {feature}` 를 사용하세요.
```

### 3-B.3 CSO — Plugin Validation 통합 설계

**CSO 역할 확장**: 기존 `vais-validate-plugin` 스킬을 CSO 게이트에 흡수.

```
agents/cso.md              ← CSO 에이전트 정의
skills/vais/phases/cso.md  ← CSO 워크플로우 지침
```

CSO가 실행하는 두 가지 게이트:

**Gate A — 보안 검토** (기존):
```
- OWASP Top 10 체크
- 인증/인가 설계 검토
- 민감 데이터 처리 검토
→ docs/04-qa/{f}-security.md
```

**Gate B — Plugin Validation** (신규 통합):
```
- 마켓플레이스 배포 요구사항 체크 (vais-validate-plugin 로직 내장)
  - package.json claude-plugin 메타데이터 검증
  - SKILL.md 구조 규격 준수
  - agents/ frontmatter 필수 필드 검증
  - disallowedTools 설정 존재 여부
- 플러그인 코드 안전성 스캔
→ docs/04-qa/{f}-plugin-validation.md
```

트리거: `plugin 배포`, `마켓플레이스`, `배포 준비` 키워드 → CSO Gate B 자동 실행.

`skills/vais-validate-plugin/SKILL.md` → deprecated redirect:
```markdown
---
name: vais-validate-plugin
description: ⚠️ DEPRECATED: CSO 에이전트로 통합됨
---
플러그인 검증은 CSO가 담당합니다. `/vais cso {feature}` 를 사용하세요.
```

### 3-B.4 CEO — Reference Absorption 지시 설계

CEO는 레퍼런스 흡수를 **지시하고 최종 승인**합니다. 기술 평가는 CTO에 위임.

```
agents/ceo.md              ← CEO 에이전트 정의 (tools에 absorb 평가 요청 포함)
skills/vais/phases/ceo.md  ← CEO 워크플로우 지침
```

CEO 레퍼런스 흡수 플로우 (`/vais ceo:absorb {path}`):
```
1. CEO: 전략적 판단
   - "vais 방향성과 맞는가?" (비즈니스/철학 관점)
   - CTO에게 기술 평가 위임 (Agent 도구로 cto 서브에이전트 호출)

2. CTO: lib/absorb-evaluator.js 실행
   - .vais/absorption-ledger.jsonl 중복 체크
   - 기존 skills/ 파일들과 내용 유사도 검사
   - 품질/구조화 수준 평가
   - 평가 리포트 반환

3. CEO: 판정 + 승인
   - ✅ 흡수 승인 → CTO 실행 + Ledger 기록
   - ⚠️ 조건부 → 병합 방향 지시 + CTO 실행
   - ❌ 거부 → 근거 기록 후 종료
```

단독 유틸리티 (`/vais absorb {path}`): CEO 없이 CTO 직접 평가, 사용자 확인.

### 3-B.5 `/vais auto` 폐기 처리

`skills/vais/phases/auto.md` → deprecated redirect:
```markdown
---
name: auto
description: ⚠️ DEPRECATED
---
/vais auto는 삭제되었습니다.
C-Suite를 직접 조합하세요: /vais cto {feature} 또는 /vais ceo:cto {feature}
```

---

## 3-C. Reference Absorption 모듈 설계

### 3-C.1 lib/absorb-evaluator.js

```javascript
class AbsorbEvaluator {
  constructor(ledgerPath, skillsBasePath)

  // 중복 체크: Ledger에 동일 source 경로 존재?
  checkDuplicate(sourcePath)

  // 내용 겹침: 기존 skills/ 파일들과 키워드 유사도
  checkOverlap(sourcePath)   // → { overlapping: string[], score: number }

  // 품질 평가: 구조화, 문서화, 예시 포함 여부
  assessQuality(sourcePath)  // → { score: number, reasons: string[] }

  // vais 적합성: C-Suite 역할/Layer 구조와 연결 가능?
  assessFit(sourcePath)      // → { score: number, suggestedLayer: string }

  // 전체 평가 실행
  evaluate(sourcePath)
  // → { action: 'absorb'|'reject'|'merge', reason: string, overlap: string[] }

  // Ledger에 결과 기록 (append-only)
  record(result)
}
```

### 3-C.2 .vais/absorption-ledger.jsonl 스키마

```jsonl
{
  "ts": "ISO8601",
  "action": "absorbed" | "rejected" | "pending" | "merged",
  "source": "../bkit/skills/gap-detector.md",
  "target": "skills/vais/phases/cso-security.md",  // absorbed/merged 시
  "reason": "OWASP 체크리스트 추출, 기존 CSO에 병합",
  "overlap": ["agents/qa.md"],
  "decidedBy": "user" | "auto"
}
```

### 3-C.3 skills/vais/phases/absorb.md (Layer 1 유틸리티)

```markdown
# /vais absorb — Reference Absorption

외부 레퍼런스를 평가하고 vais에 흡수합니다.

## 사용법
/vais absorb {path}           # 단일 파일 또는 디렉토리
/vais absorb --history        # 흡수 이력 조회
/vais absorb --history --filter=rejected  # 거부된 항목만

## 실행 순서
1. AbsorbEvaluator.evaluate(path) 실행
2. 결과 출력 (흡수/거부/병합 + 근거)
3. 사용자 확인
4. 실행 + Ledger 기록
```

---

## 4. 설정 파일 설계

### 4.1 vais.config.json v2

**현재** → **v2 구조** (하위 호환):

```json
{
  "version": "2.0.0",
  "plugin": {
    "name": "vais-code",
    "description": "Virtual AI C-Suite for software development",
    "distributionUrl": "https://github.com/your-org/vais-claude-code"
  },
  "cSuite": {
    "orchestrator": "cto",
    "deprecated": {
      "manager": "cto"
    },
    "roles": {
      "cto": { "required": true,  "model": "opus",   "layer": "strategy-tech",    "agent": "agents/cto.md" },
      "ceo": { "required": false, "model": "opus",   "layer": "strategy-biz",     "agent": "agents/ceo.md" },
      "cpo": { "required": false, "model": "opus",   "layer": "strategy-product", "agent": "agents/cpo.md" },
      "cmo": { "required": false, "model": "sonnet", "layer": "growth",           "agent": "agents/cmo.md" },
      "cso": { "required": false, "model": "sonnet", "layer": "quality",          "agent": "agents/cso.md" },
      "cdo": { "required": false, "model": "sonnet", "layer": "data",             "agent": "agents/cdo.md" },
      "cro": { "required": false, "model": "sonnet", "layer": "growth",           "agent": "agents/cro.md" },
      "coo": { "required": false, "model": "sonnet", "layer": "ops",              "agent": "agents/coo.md" }
    },
    "autoKeywords": {
      "cso": ["payment", "auth", "login", "security", "결제", "인증", "보안"],
      "cmo": ["landing", "marketing", "launch", "마케팅", "랜딩", "캠페인"],
      "cdo": ["analytics", "dashboard", "metrics", "분석", "대시보드", "지표"],
      "ceo": ["new product", "신규 서비스", "방향", "전략", "strategy"],
      "coo": ["deploy", "release", "배포", "릴리스", "운영", "infra"]
    }
  },
  "observability": {
    "enabled": true,
    "stateFile": ".vais/agent-state.json",
    "eventLog": ".vais/event-log.jsonl",
    "maxEventLogSizeMB": 10,
    "rotateAfterDays": 30,
    "archivePath": ".vais/archive/"
  },
  "mcp": {
    "enabled": false,
    "server": "mcp/vais-server/",
    "port": 8765
  },
  "workflow": {
    "defaultChain": "cto",
    "gates": 4,
    "maxQaRetries": 3
  }
}
```

> 기존 `version`, `workflow` 등의 키는 모두 유지. `cSuite`, `observability`, `mcp`, `plugin` 섹션만 추가.

### 4.2 package.json — 플러그인 메타데이터

```json
{
  "name": "vais-code",
  "version": "2.0.0",
  "description": "Virtual AI C-Suite for software development — Claude Code Plugin",
  "author": "",
  "license": "MIT",
  "claude-plugin": {
    "skills": ["skills/vais/SKILL.md"],
    "agents": ["agents/"],
    "hooks": ["hooks/settings.json"],
    "mcp": ["mcp/vais-server/"]
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "keywords": ["claude-code", "claude-plugin", "ai-agents", "c-suite", "vais"]
}
```

---

## 5. 데이터 흐름

### 5.1 에이전트 실행 시 흐름

```
사용자: /vais cto login
  ↓
skills/vais/SKILL.md (진입점)
  ↓ SubagentStart 훅 발동
scripts/agent-start.js cto plan
  ↓
lib/observability/state-writer.js → .vais/agent-state.json 업데이트
lib/observability/event-logger.js → .vais/event-log.jsonl 기록
  ↓
agents/cto.md 실행 (Plan 단계 수행)
  ↓
단계 전환 시: scripts/phase-transition.js plan design login
  ↓
lib/observability/event-logger.js → phase_transition 이벤트 기록
  ↓
SubagentStop 훅 발동
scripts/agent-stop.js cto success docs/01-plan/login.md
  ↓
lib/observability/state-writer.js → active_agents에서 제거, completed_agents에 추가
lib/observability/event-logger.js → agent_stop 이벤트 기록
```

### 5.2 미래 MCP 서버 연결

```
Phase 3 이후:
mcp/vais-server/tools/agent-state.ts
  → import { StateWriter } from '../../lib/observability/state-writer.js'
  → sw.read() → MCP 응답으로 반환

mcp/vais-server/tools/event-history.ts
  → import { EventLogger } from '../../lib/observability/event-logger.js'
  → el.query({ since, limit }) → MCP 응답으로 반환
```

Phase 1에서 만든 `lib/observability/`를 Phase 3이 그대로 import. **재작업 없음**.

---

## 6. 에러 처리 및 안전 설계

### 6.1 Graceful Degradation

observability 모듈은 **실패해도 에이전트 실행이 중단되지 않아야 합니다**:

```javascript
// scripts/agent-start.js
try {
  sw.markAgentStart(role, phase, task)
  el.log('agent_start', { role, phase })
} catch (err) {
  // observability 실패는 stderr에만 출력, 프로세스는 정상 종료
  console.error('[vais observability] failed to record:', err.message)
  process.exit(0)  // 0으로 종료 → 훅 실패로 에이전트 중단 방지
}
```

### 6.2 .vais/ 디렉토리 자동 생성

```javascript
// lib/observability/state-writer.js 생성자
constructor(stateFilePath) {
  this.path = stateFilePath
  fs.mkdirSync(path.dirname(stateFilePath), { recursive: true })
}
```

### 6.3 동시 쓰기 보호

`event-log.jsonl`은 append-only이므로 동시 쓰기 시 파일 손상 위험:
- `fs.appendFileSync` 대신 파일 잠금 사용 (선택적)
- Phase 1에서는 단일 에이전트 순차 실행이므로 충돌 없음
- Phase 2 이후 병렬 C-Suite 사용 시 `proper-lockfile` 라이브러리 추가 검토

---

## 7. 테스트 전략

### 7.1 단위 테스트 대상

| 파일 | 테스트 항목 |
|------|-----------|
| state-writer.js | markAgentStart / markAgentStop 후 JSON 상태 검증 |
| event-logger.js | log() 후 JSONL 파일 내용 검증, query() 필터링 |
| rotation.js | shouldRotate() 조건 검증 |
| schema.js | EVENT_SCHEMAS 유효성 검사 |

### 7.2 통합 테스트

```bash
# 수동 검증 시나리오
node scripts/agent-start.js cto plan "데이터 모델 정의"
cat .vais/agent-state.json  # ← active_agents에 cto 확인

node scripts/agent-stop.js cto success docs/01-plan/login.md
cat .vais/agent-state.json  # ← completed_agents에 cto 확인
cat .vais/event-log.jsonl   # ← agent_start + agent_stop 2줄 확인
```

---

## 8. 디렉토리 변경 요약

### Phase 1에서 변경되는 파일 (18개)

**신규 생성 (11개)**:
```
lib/observability/index.js
lib/observability/state-writer.js
lib/observability/event-logger.js
lib/observability/schema.js
lib/observability/rotation.js
scripts/agent-start.js
scripts/agent-stop.js
scripts/phase-transition.js
hooks/events.json
hooks/settings.json
skills/vais/phases/cto.md
```

**수정 (6개)**:
```
agents/cto.md              ← manager.md 내용 이전 + Stop 훅 추가
agents/manager.md          ← deprecated 라우팅으로 교체
vais.config.json           ← v2 구조로 확장
package.json               ← claude-plugin 메타데이터 추가
skills/vais/SKILL.md       ← manager → cto 참조 업데이트
lib/memory.js              ← "manager" → "cto" 문자열
```

**gitignore 추가 (1개)**:
```
.vais/agent-state.json
.vais/event-log.jsonl
.vais/archive/
```

---

## 9. 성공 기준

### Phase 1 — 코어 재구성

| ID | 검증 방법 |
|----|---------|
| SC-01 | `/vais cto login` 실행 → 기존 manager와 동일 동작 |
| SC-02 | 실행 후 `.vais/event-log.jsonl`에 `agent_start` + `agent_stop` 이벤트 존재 |
| SC-03 | 실행 중 `.vais/agent-state.json`에 `active_agents`에 cto 존재 |
| SC-04 | `/vais manager login` → deprecated 경고 출력 후 cto로 자동 실행 |
| SC-05 | `node scripts/agent-start.js cto plan test` → .vais/ 자동 생성 + 파일 기록 |
| SC-06 | observability 스크립트 실패 시 에이전트 실행 중단되지 않음 |

### Phase 2 — C-Suite 에이전트

| ID | 검증 방법 |
|----|---------|
| SC-07 | `/vais ceo:cto:cso login` 체이닝 정상 실행 |
| SC-08 | CMO 실행 후 `docs/05-marketing/{f}-seo.md` 생성 |
| SC-09 | CSO 실행 후 `docs/04-qa/{f}-plugin-validation.md` 생성 |
| SC-10 | `/vais auto` 실행 시 deprecated 메시지 출력 |
| SC-11 | `/vais absorb {path}` 실행 시 평가 결과(흡수/거부/중복) 출력 |
| SC-12 | `.vais/absorption-ledger.jsonl`에 흡수 결정 기록 |
| SC-13 | 중복 흡수 시도 시 기존 이력 참조하여 경고 출력 |

---

## 10. Session Guide (Module Map)

### Phase 1 모듈 (3세션)

| Module | 내용 | 파일 수 |
|--------|------|--------|
| module-1 | `lib/observability/` 전체 (5개 파일) | 5 |
| module-2 | `scripts/` 3개 + `hooks/` 2개 | 5 |
| module-3 | `agents/cto.md` + `agents/manager.md` + `vais.config.json` + `package.json` + `skills/vais/SKILL.md` + `lib/memory.js` | 6 |

### Phase 2 모듈 (3세션)

| Module | 내용 | 파일 수 |
|--------|------|--------|
| module-4 | `agents/ceo.md` + `agents/cpo.md` + `skills/vais/phases/ceo.md` + `skills/vais/phases/cpo.md` | 4 |
| module-5 | `agents/cmo.md` (SEO 통합) + `agents/cso.md` (Plugin Val 통합) + 해당 phase 파일 2개 + deprecated redirect 2개 | 6 |
| module-6 | `agents/cdo.md` + `agents/cro.md` + `agents/coo.md` + phase 파일 3개 + `lib/absorb-evaluator.js` + `skills/vais/phases/absorb.md` + `skills/vais/phases/auto.md` (deprecated) | 9 |

**권장 세션 분리**:
```
Phase 1:
  Session 1: /pdca do c-suite-architecture --scope module-1
  Session 2: /pdca do c-suite-architecture --scope module-2
  Session 3: /pdca do c-suite-architecture --scope module-3

Phase 2:
  Session 4: /pdca do c-suite-architecture --scope module-4
  Session 5: /pdca do c-suite-architecture --scope module-5
  Session 6: /pdca do c-suite-architecture --scope module-6
```

또는 Phase 단위: `/pdca do c-suite-architecture` (전체)

---

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-03-31 | 초안 — Option B Clean Architecture 선택 |
| v2.0 | 2026-04-01 | Plan v3.3 반영 — Phase 2 C-Suite 설계, CMO+SEO, CSO+Plugin Val, CEO+Absorption, /vais auto deprecated, Session Guide 확장 |
