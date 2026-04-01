# Plan: vais v2 — 확장 가능 C-Suite 플랫폼 아키텍처

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | c-suite-architecture |
| 작성일 | 2026-04-01 |
| 버전 | v3.0 (플랫폼 재설계) |
| 목표 | 배포용 플러그인 + C-Suite 에이전트 + 대시보드 UI 확장까지 지원하는 6-레이어 아키텍처 |

### Value Delivered

| 관점 | 내용 |
|------|------|
| Problem | 현재 vais는 단일 모놀리식 구조 — C-Suite 추가 시 비대화, 대시보드 추가 시 전면 재설계 불가피 |
| Solution | 6-레이어 플랫폼 아키텍처: Plugin → Agent → State/Event → MCP → Dashboard. 각 레이어 독립 교체 가능 |
| Function UX Effect | 사용자는 `/vais ceo:cto:cso login`으로 C-Suite 조합. `/vais absorb {path}`로 외부 레퍼런스를 지각 있게 흡수하고 이력 관리 |
| Core Value | vais가 단순 워크플로우 툴에서 확장 가능한 AI 개발 플랫폼으로 진화. 커뮤니티가 C-Suite 역할을 기여 가능 |

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | 배포용 플러그인 + Paperclip 스타일 대시보드까지 확장 예정. 지금 구조로 붙이면 나중에 전부 재설계 필요 |
| WHO | vais-code 플러그인 배포자, 설치 사용자, 대시보드 UI 소비자 |
| RISK | 레이어 과설계로 초기 복잡도 증가. MCP 서버 추가 의존성. 대시보드는 별도 레포 필요 |
| SUCCESS | SC-01: 6-레이어 경계가 명확히 분리됨. SC-02: C-Suite 에이전트 독립 추가/제거 가능. SC-03: 에이전트 상태가 `.vais/agent-state.json`에 기록됨. SC-04: MCP 서버로 상태 외부 노출. SC-05: 기존 체이닝 문법 완전 호환 |
| SCOPE | 전체 vais 구조 재설계. agents/, skills/, hooks/, mcp/, vais.config.json, lib/ |

---

## 1. 왜 지금 플랫폼으로 재설계해야 하는가

### 1.1 단계별 추가 vs. 플랫폼 재설계 비교

| 접근 | 단계별 추가 | 플랫폼 재설계 (선택) |
|------|-----------|------------------|
| 초기 비용 | 낮음 | 높음 |
| C-Suite 8개 추가 | 파일만 추가 | 레이어에 맞게 배치 |
| 대시보드 추가 시 | **전면 재설계 필요** | 레이어만 추가 |
| 커뮤니티 기여 | 어려움 (규칙 불명확) | 명확한 인터페이스로 기여 가능 |
| 배포/업데이트 | 전체 패키지 교체 | 레이어별 독립 업데이트 |

### 1.2 대시보드를 위해 지금 필요한 것

대시보드가 보여주려면:
```
에이전트가 뭘 하는지 → State Layer가 기록해야 함
어떤 결정을 했는지 → Event Log가 쌓여야 함
외부 앱이 읽으려면 → MCP Server가 노출해야 함
```

이 세 가지가 없으면 대시보드에 보여줄 데이터 자체가 없습니다.

---

## 2. vais v2 — 6-레이어 플랫폼 아키텍처

```
┌─────────────────────────────────────────────────────┐
│  Layer 6: Dashboard UI                               │
│  Web app / CLI dashboard (Paperclip 스타일)          │
│  별도 레포: vais-dashboard                           │
│  소비: MCP Server Tools                              │
└──────────────────────────┬──────────────────────────┘
                           │ reads from
┌──────────────────────────▼──────────────────────────┐
│  Layer 5: MCP Server                                 │
│  mcp/vais-server/ (Bun)                             │
│  Tools: agent_state, phase_history, c_suite_log     │
│  실시간 상태 외부 노출                                 │
└──────────────────────────┬──────────────────────────┘
                           │ reads from
┌──────────────────────────▼──────────────────────────┐
│  Layer 4: State & Event                              │
│  .vais/agent-state.json  — 에이전트 현재 상태         │
│  .vais/event-log.jsonl   — 전체 이벤트 감사 로그      │
│  hooks/events.json       — 이벤트 정의               │
│  ← SubagentStart/Stop/PhaseTransition 훅이 기록      │
└──────────────────────────┬──────────────────────────┘
                           │ emitted by
┌──────────────────────────▼──────────────────────────┐
│  Layer 3: C-Suite Agent Layer                        │
│  agents/cto.md   agents/ceo.md   agents/cpo.md      │
│  agents/cmo.md   agents/cso.md   agents/cdo.md      │
│  agents/cro.md   agents/coo.md                      │
│  각 에이전트: 독립 .md, 자체 hooks, model, tools      │
└──────────────────────────┬──────────────────────────┘
                           │ orchestrated by CTO
┌──────────────────────────▼──────────────────────────┐
│  Layer 2: Implementation Agent Layer                 │
│  agents/design.md  agents/architect.md              │
│  agents/frontend.md  agents/backend.md  agents/qa.md│
│  (기존 유지)                                          │
└──────────────────────────┬──────────────────────────┘
                           │ defined in
┌──────────────────────────▼──────────────────────────┐
│  Layer 1: Plugin Distribution                        │
│  skills/vais/SKILL.md         — 진입점               │
│  skills/vais/phases/*.md      — 각 C-Suite 지침       │
│  vais.config.json             — C-Suite 레지스트리    │
│  package.json                 — 플러그인 메타데이터    │
│  → claude plugin add 로 설치                         │
└─────────────────────────────────────────────────────┘
```

---

## 3. 레이어별 상세 설계

### Layer 1: Plugin Distribution

**목적**: 설치/업데이트/배포 구조

```json
// package.json (플러그인 메타데이터)
{
  "name": "vais-code",
  "version": "2.0.0",
  "description": "Virtual AI C-Suite for software development",
  "claude-plugin": {
    "skills": ["skills/vais/SKILL.md"],
    "agents": ["agents/"],
    "hooks": ["hooks/"],
    "mcp": ["mcp/vais-server/"]
  }
}
```

**확장 포인트**: 3rd party가 `vais-cmo-advanced` 같은 별도 플러그인으로 CMO 역할 교체 가능

### Layer 3: C-Suite Agent — 표준 인터페이스

각 C-Suite 에이전트는 동일한 frontmatter 구조를 따릅니다:

```yaml
# agents/cto.md (예시)
---
name: cto
version: 1.0.0
description: |
  CTO. 기술 방향 설정 + 전체 오케스트레이션.
  Triggers: cto, technical planning, 기술 계획
model: opus
tools: [Read, Write, Edit, Glob, Grep, Bash, Agent, TodoWrite, AskUserQuestion]
memory: project
hooks:
  Start:
    - type: command
      command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/agent-start.js cto"
  Stop:
    - type: command
      command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/agent-stop.js cto"
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push --force*)"
---
```

**표준 인터페이스 덕분에**: 어떤 C-Suite 역할도 동일한 패턴으로 추가/교체 가능

### Layer 4: State & Event Schema

**agent-state.json** (실시간 상태):
```json
{
  "session": "2026-04-01T10:00:00Z",
  "feature": "login",
  "active_agents": [
    {
      "role": "cto",
      "status": "running",
      "phase": "plan",
      "started_at": "2026-04-01T10:01:00Z",
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

**event-log.jsonl** (감사 로그):
```jsonl
{"ts":"2026-04-01T10:00:00Z","event":"session_start","feature":"login","c_suite":["ceo","cto","cso"]}
{"ts":"2026-04-01T10:00:05Z","event":"agent_start","role":"ceo","phase":"discovery"}
{"ts":"2026-04-01T10:02:30Z","event":"agent_stop","role":"ceo","outcome":"success","doc":"docs/00-discovery/login-ceo.md"}
{"ts":"2026-04-01T10:02:31Z","event":"agent_start","role":"cto","phase":"plan"}
{"ts":"2026-04-01T10:02:31Z","event":"gate_check","gate":1,"result":"pass","items":4}
{"ts":"2026-04-01T10:05:00Z","event":"decision","role":"cto","type":"architecture","choice":"nextjs+supabase"}
{"ts":"2026-04-01T10:10:00Z","event":"agent_stop","role":"cto","outcome":"success","doc":"docs/01-plan/login.md"}
```

**훅 이벤트 목록** (hooks/events.json):
```json
{
  "agent_start": "에이전트 시작 시",
  "agent_stop": "에이전트 완료/실패 시",
  "phase_transition": "단계 전환 시 (plan→design 등)",
  "gate_check": "Gate 판정 시",
  "decision_record": "C-Suite 결정 기록 시",
  "error": "에러 발생 시"
}
```

### Layer 5: MCP Server

**mcp/vais-server/** (Bun 기반, gstack 패턴 참고):

```typescript
// MCP Tools 정의
const tools = [
  {
    name: "vais_agent_state",
    description: "현재 활성 에이전트 상태 조회",
    // → .vais/agent-state.json 읽기
  },
  {
    name: "vais_event_history",
    description: "이벤트 로그 조회 (시간 범위, 역할 필터)",
    // → .vais/event-log.jsonl 필터링
  },
  {
    name: "vais_phase_progress",
    description: "현재 피처의 단계별 진행률",
    // → .vais/status.json 읽기
  },
  {
    name: "vais_decisions",
    description: "C-Suite 결정 목록 조회",
    // → event-log에서 decision 이벤트 필터
  },
  {
    name: "vais_c_suite_activity",
    description: "C-Suite 에이전트별 활동 요약",
    // → 세션별 에이전트 활동 집계
  }
]
```

### Layer 6: Dashboard (별도 레포 — vais-dashboard)

**아키텍처**: MCP Client → MCP Server → State Files

```
vais-dashboard/
├── src/
│   ├── components/
│   │   ├── AgentActivity.tsx      ← 에이전트 실시간 상태
│   │   ├── PipelineProgress.tsx   ← 단계별 진행률
│   │   ├── CsuiteSummary.tsx      ← C-Suite 결정 요약
│   │   └── EventTimeline.tsx      ← 이벤트 타임라인
│   └── hooks/
│       └── useMcpClient.ts        ← MCP 서버 연결
└── package.json
```

---

## 4. C-Suite 에이전트 정의 (Layer 3)

### 4.1 전체 맵

| 역할 | 언제 | 모델 | 참고 소스 | 산출물 |
|------|------|------|---------|--------|
| **CTO** (필수) | 항상 — Plan + 오케스트레이션 + 레퍼런스 기술 평가 실행 | opus | manager 대체 | `docs/01-plan/` |
| **CEO** (선택) | 비즈니스 방향 불명확 시 / **레퍼런스 흡수 지시 및 최종 승인** | opus | gstack CEO-review, pm-skills OST | `docs/00-discovery/{f}-ceo.md` |
| **CPO** (선택) | PRD 필요 시 | opus | pm-skills 전체 | `docs/00-discovery/{f}-prd.md` |
| **CMO** (선택) | 마케팅 콘텐츠 필요 시 / **SEO 감사 및 최적화** | sonnet | marketingskills, vais-seo | `docs/05-marketing/{f}.md`, `docs/05-marketing/{f}-seo.md` |
| **CSO** (선택) | 보안 민감 기능 / **플러그인 배포 검증 (Plugin Validation)** | sonnet | gstack CSO, OWASP, vais-validate-plugin | `docs/04-qa/{f}-security.md`, `docs/04-qa/{f}-plugin-validation.md` |
| **CDO** (선택) | 데이터/분석 설계 시 | sonnet | analytics-tracking | `docs/01-plan/{f}-data.md` |
| **CRO** (선택) | 전환율/수익 최적화 시 | sonnet | marketingskills CRO | `docs/05-marketing/{f}-revenue.md` |
| **COO** (선택) | 배포/운영 계획 시 | sonnet | gstack ship/canary | `docs/06-deployment/{f}-deploy.md` |

### 4.2 auto 모드 — 컨텍스트 기반 C-Suite 자동 선택

```
/vais auto {feature} 실행 시:
1. 피처명 + .vais/memory.json 분석
2. 키워드 매핑:
   - "결제/payment/auth/login" → + CSO 필수 추가
   - "랜딩/landing/마케팅" → + CMO + CRO 추가
   - "analytics/분석/대시보드" → + CDO 추가
   - "신규 서비스/새 제품" → + CEO + CPO 제안
   - "배포/deploy/릴리스" → + COO 추가
3. AskUserQuestion: "추천 C-Suite: [CTO, CSO]. 조정하시겠어요?"
4. 확정 후 체이닝 실행
```

---

## 5. 디렉토리 구조 (전체)

```
vais-claude-code/
├── package.json                    ← 플러그인 메타데이터 (신규)
├── vais.config.json                ← C-Suite 레지스트리 + MCP 설정
├── AGENTS.md
├── CHANGELOG.md
│
├── agents/                         ← Layer 2 & 3
│   ├── cto.md                      ← manager 대체 (수정)
│   ├── ceo.md                      ← 신규
│   ├── cpo.md                      ← 신규
│   ├── cmo.md                      ← 신규
│   ├── cso.md                      ← 신규
│   ├── cdo.md                      ← 신규
│   ├── cro.md                      ← 신규
│   ├── coo.md                      ← 신규
│   ├── manager.md                  ← deprecated (CTO 라우팅)
│   ├── design.md                   ← 유지
│   ├── architect.md                ← 유지
│   ├── frontend.md                 ← 유지
│   ├── backend.md                  ← 유지
│   └── qa.md                       ← 유지
│
├── skills/vais/                    ← Layer 1
│   ├── SKILL.md                    ← 진입점 (수정)
│   └── phases/
│       ├── cto.md                  ← manager.md 대체 (수정)
│       ├── ceo.md                  ← 신규
│       ├── cpo.md                  ← 신규
│       ├── cmo.md                  ← 신규
│       ├── cso.md                  ← 신규
│       ├── cdo.md                  ← 신규
│       ├── cro.md                  ← 신규
│       ├── coo.md                  ← 신규
│       ├── manager.md              ← deprecated redirect
│       ├── plan.md / design.md / ... ← 유지
│
├── hooks/                          ← Layer 4 (신규)
│   ├── events.json                 ← 이벤트 스키마 정의
│   └── settings.json               ← CC 훅 설정
│
├── scripts/                        ← Layer 4 지원
│   ├── agent-start.js              ← 에이전트 시작 시 state 기록
│   ├── agent-stop.js               ← 에이전트 종료 시 state 기록
│   ├── phase-transition.js         ← 단계 전환 시 event 기록
│   └── prompt-handler.js           ← deprecated 라우팅 (수정)
│
├── mcp/                            ← Layer 5 (신규)
│   └── vais-server/
│       ├── index.ts                ← MCP 서버 진입점
│       ├── tools/
│       │   ├── agent-state.ts
│       │   ├── event-history.ts
│       │   ├── phase-progress.ts
│       │   ├── decisions.ts
│       │   └── c-suite-activity.ts
│       └── package.json
│
├── lib/
│   ├── memory.js                   ← "manager" → "cto" (수정)
│   ├── state-writer.js             ← agent-state.json 관리 (신규)
│   └── event-logger.js             ← event-log.jsonl 기록 (신규)
│
└── .vais/                          ← 런타임 상태 (gitignore)
    ├── agent-state.json            ← 실시간 상태
    ├── event-log.jsonl             ← 감사 로그
    ├── memory.json                 ← 기존 유지
    └── status.json                 ← 기존 유지
```

---

## 6. vais.config.json 확장 설계

```json
{
  "version": "2.0.0",
  "plugin": {
    "name": "vais-code",
    "distributionUrl": "https://github.com/your/vais-claude-code"
  },
  "cSuite": {
    "orchestrator": "cto",
    "deprecated": { "manager": "cto" },
    "roles": {
      "cto":  { "required": true,  "model": "opus",   "layer": "strategy-tech" },
      "ceo":  { "required": false, "model": "opus",   "layer": "strategy-biz" },
      "cpo":  { "required": false, "model": "opus",   "layer": "strategy-product" },
      "cmo":  { "required": false, "model": "sonnet", "layer": "growth" },
      "cso":  { "required": false, "model": "sonnet", "layer": "quality" },
      "cdo":  { "required": false, "model": "sonnet", "layer": "data" },
      "cro":  { "required": false, "model": "sonnet", "layer": "growth" },
      "coo":  { "required": false, "model": "sonnet", "layer": "ops" }
    },
    "autoKeywords": {
      "cso":  ["payment", "auth", "login", "security", "결제", "인증"],
      "cmo":  ["landing", "marketing", "launch", "마케팅", "랜딩"],
      "cdo":  ["analytics", "dashboard", "metrics", "분석", "대시보드"],
      "ceo":  ["new product", "신규 서비스", "방향"],
      "coo":  ["deploy", "release", "배포", "릴리스"]
    }
  },
  "observability": {
    "stateFile": ".vais/agent-state.json",
    "eventLog": ".vais/event-log.jsonl",
    "maxEventLogSize": "10MB",
    "rotateAfterDays": 30
  },
  "mcp": {
    "enabled": false,
    "server": "mcp/vais-server/",
    "port": 8765
  },
  "workflow": { "...기존 내용 유지..." }
}
```

---

## 7. 구현 순서

### Phase 1 — 코어 재구성 (2~3일)
```
1-a. vais.config.json v2 구조로 재설계
1-b. manager → CTO 리네이밍 + deprecated 라우팅
1-c. lib/state-writer.js + lib/event-logger.js 신규 생성
1-d. scripts/agent-start.js + agent-stop.js 신규 생성
1-e. hooks/settings.json CC 훅 설정
→ 검증: /vais cto login 실행 시 event-log.jsonl 기록 확인
```

### Phase 2 — C-Suite 에이전트 추가 (3~4일)
```
2-a. CEO + CPO (발견 레이어)
2-b. CSO + CDO (품질/데이터)
2-c. CMO + CRO (성장)
2-d. COO (운영)
2-e. auto 모드 키워드 매핑
→ 검증: /vais ceo:cto:cso login 체이닝 실행
```

### Phase 3 — MCP 서버 (2~3일)
```
3-a. mcp/vais-server/ 기본 구조 (Bun)
3-b. 5개 MCP Tools 구현
3-c. vais.config.json mcp.enabled: true
→ 검증: MCP 도구로 agent-state.json 조회
```

### Phase 4 — 대시보드 (별도 레포, 이후)
```
4-a. vais-dashboard 레포 생성
4-b. MCP Client 연결
4-c. AgentActivity + PipelineProgress UI
→ Paperclip 스타일 에이전트 활동 시각화
```

---

## 8. 리스크

| 리스크 | 가능성 | 대응 |
|--------|--------|------|
| Phase 1 없이 Phase 2 진행 시 대시보드 나중에 다시 설계 | 높음 | **Phase 1 State Layer가 최우선** |
| MCP 서버 의존성 (Bun 필요) | 중 | Phase 3은 선택적. Phase 1~2만으로도 플러그인 배포 가능 |
| event-log.jsonl 용량 | 낮 | maxEventLogSize + rotateAfterDays 설정 |
| 기존 사용자 breaking change | 중 | manager → CTO deprecated 라우팅으로 부드러운 마이그레이션 |

---

## 9. 성공 기준

| ID | 기준 |
|----|------|
| SC-01 | `/vais cto login` = 현재 manager와 동일 동작 |
| SC-02 | 에이전트 실행 시 `.vais/event-log.jsonl`에 이벤트 기록 |
| SC-03 | `.vais/agent-state.json`에 실시간 에이전트 상태 |
| SC-04 | `/vais ceo:cto:cso login` 체이닝 정상 실행 |
| SC-05 | MCP 서버로 `vais_agent_state` 도구 호출 가능 |
| SC-06 | `vais.config.json`의 `cSuite.autoKeywords`로 자동 C-Suite 선택 |
| SC-07 | 기존 `/vais manager login` → deprecated 경고 + CTO 자동 라우팅 |
| SC-08 | `/vais absorb {path}` 실행 시 평가 결과(흡수/거부/중복) 출력 |
| SC-09 | `.vais/absorption-ledger.jsonl`에 모든 흡수 결정 기록 |
| SC-10 | 중복 흡수 시도 시 기존 흡수 이력 참조하여 경고 출력 |

---

## 10. 전체 Skill/Layer 맵

### 10.1 완전한 레이어 구조

```
┌─────────────────────────────────────────────────────────┐
│  Layer 6: Dashboard UI (별도 레포: vais-dashboard)        │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│  Layer 5: MCP Server (mcp/vais-server/)                  │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│  Layer 4: State & Event                                   │
│  .vais/agent-state.json  .vais/event-log.jsonl           │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│  Layer 3: C-Suite Agents  (skills/vais/phases/*)         │
│                                                          │
│  [필수]                                                   │
│  /vais cto       — Plan + 오케스트레이션 + 레퍼런스 기술평가  │
│                                                          │
│  [선택 — 전략]                                            │
│  /vais ceo       — 비즈니스 방향 + 레퍼런스 흡수 지시/승인  │
│  /vais cpo       — PRD 작성                              │
│                                                          │
│  [선택 — 성장]                                            │
│  /vais cmo       — 마케팅 콘텐츠 + SEO 감사               │
│  /vais cro       — 전환율/수익 최적화                     │
│                                                          │
│  [선택 — 품질/보안]                                       │
│  /vais cso       — 보안 검토 + Plugin Validation          │
│                                                          │
│  [선택 — 데이터/운영]                                     │
│  /vais cdo       — 데이터/분석 설계                       │
│  /vais coo       — 배포/운영 계획                         │
└────────────────────────────┬────────────────────────────┘
                             │ orchestrated by CTO
┌────────────────────────────▼────────────────────────────┐
│  Layer 2: Implementation Agents  (skills/vais/phases/*)  │
│                                                          │
│  /vais design    — UI/UX 설계                            │
│  /vais architect — 기술 아키텍처                          │
│  /vais frontend  — 프론트엔드 구현                        │
│  /vais backend   — 백엔드 구현                            │
│  /vais qa        — QA 검증                               │
│  /vais test      — 테스트 실행                            │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│  Layer 1: Utility Skills  (skills/vais/phases/*)         │
│  (특정 C-Suite에 귀속되지 않는 독립 워크플로우 도구)          │
│                                                          │
│  /vais init      — 프로젝트 초기화                        │
│  /vais commit    — Git 커밋 헬퍼                          │
│  /vais status    — 현재 워크플로우 상태 조회               │
│  /vais next      — 다음 단계 안내                         │
│  /vais report    — 완료 리포트 생성                       │
│  /vais help      — 사용법 안내                            │
│  /vais absorb    — 레퍼런스 흡수 (신규, §11)              │
│                                                          │
│  ❌ /vais auto   — deprecated (§10.2 참조)               │
│  ❌ /vais manager — deprecated → /vais cto 로 라우팅      │
└─────────────────────────────────────────────────────────┘
```

### 10.2 `/vais auto` 폐기 결정

**폐기 이유:**

| 문제 | 설명 |
|------|------|
| 가짜 자동화 | 키워드 분석 후 결국 사용자에게 확인을 요청함. "auto"가 아님 |
| 불필요한 복잡도 | `/vais ceo:cto:cso login` 처럼 명시적 체이닝이 더 명확하고 예측 가능 |
| 유지보수 부담 | autoKeywords 매핑을 계속 갱신해야 하고 오탐 가능성 있음 |
| 중복 기능 | `vais.config.json`의 `autoKeywords`가 동일한 역할 — 레이어 중복 |

**대안:** 사용자가 직접 체이닝 `ceo:cto:cso` 명시. 불확실하면 `help`로 C-Suite 역할 확인.

**마이그레이션:** `skills/vais/phases/auto.md` → deprecated 리다이렉트 파일로 교체 (아래 메시지 출력):
```
/vais auto는 deprecated되었습니다.
C-Suite를 직접 조합하세요: /vais cto {feature} 또는 /vais ceo:cto {feature}
```

### 10.3 흡수 대상 외부 스킬

| 외부 스킬 | 흡수 위치 | 상태 |
|---------|---------|------|
| `skills/vais-seo/SKILL.md` | CMO 산출물로 통합 | Layer 3 흡수 |
| `skills/vais-validate-plugin/SKILL.md` | CSO 게이트로 통합 | Layer 3 흡수 |

---

## 11. Reference Absorption System

### 11.1 왜 필요한가

외부 레포지토리/스킬들이 많아지면:
- 같은 내용이 다른 이름으로 여러 번 흡수될 수 있음
- 나중에 "이게 어디서 왔지? 이미 넣었나?" 판단이 어려움
- 품질이 낮거나 vais 방향과 맞지 않는 것을 무분별하게 흡수할 위험

### 11.2 흡수 워크플로우 — CEO 주도 위임 구조

```
CEO: "이 레퍼런스 검토해봐" (/vais ceo:absorb {path})
        │
        ▼
  [CEO] 전략적 판단
  - "이게 vais 방향성과 맞는가?"
  - "지금 시점에 필요한가?"
  → CTO에게 기술 평가 위임
        │
        ▼
  [CTO] Source 스캔 + 기술 평가
  - 파일 목록, 스킬 구조 파악
  - 기존 .vais/absorption-ledger.jsonl과 중복 체크
  - 내용 유사도: 기존 skills/와 겹치는가?
  - 품질 판단: 구조화 수준, 문서화, 실용성
  → 평가 리포트 CEO에게 보고
        │
        ▼
  [CEO] 판정 확인 + 최종 승인
  ✅ 흡수 승인  — 새로운 가치, 겹침 없음
  ⚠️  조건부 흡수 — 병합 방향 지시 후 CTO 실행
  ❌ 거부        — 근거 기록 후 종료
        │
        ▼
  [CTO] 실행 + Ledger 기록
```

**단독 사용도 가능**: `/vais absorb {path}` (CEO 없이 CTO 직접 평가, 사용자 최종 확인)

### 11.3 Absorption Ledger 스키마

**`.vais/absorption-ledger.jsonl`** (감사 로그 방식, append-only):

```jsonl
{"ts":"2026-04-01T10:00:00Z","action":"absorbed","source":"../bkit/skills/gap-detector.md","target":"skills/vais/phases/cso-security.md","reason":"OWASP 체크리스트 추출, 기존 CSO에 병합","overlap":["agents/qa.md"],"decidedBy":"user"}
{"ts":"2026-04-01T10:05:00Z","action":"rejected","source":"../gstack/skills/deploy.md","reason":"COO 에이전트 범위와 90% 겹침. 신규 정보 없음","overlap":["skills/vais/phases/coo.md"],"decidedBy":"auto"}
{"ts":"2026-04-01T10:10:00Z","action":"pending","source":"../marketingskills/cro.md","reason":"CRO 에이전트 미구현 상태. Phase 2 완료 후 재시도 권장","overlap":[],"decidedBy":"auto"}
```

**필드 정의:**

| 필드 | 설명 |
|------|------|
| `action` | `absorbed` / `rejected` / `pending` / `merged` |
| `source` | 원본 파일 경로 (상대경로) |
| `target` | 흡수된 위치 (action=absorbed일 때) |
| `reason` | 판정 근거 (한 문장) |
| `overlap` | 겹친 기존 파일 목록 |
| `decidedBy` | `user` / `auto` |

### 11.4 평가 기준 (Evaluation Rubric)

| 기준 | 가중치 | 판단 방법 |
|------|--------|---------|
| **중복 여부** | 최우선 | Ledger에 동일 source 경로 존재 여부 |
| **내용 겹침** | 높음 | 기존 skills/ 파일들과 키워드/구조 유사도 |
| **품질** | 중 | 구조화 수준, 예시 포함 여부, 문서 완성도 |
| **vais 적합성** | 중 | C-Suite 역할 / Layer 구조와 연결 가능한가 |
| **신규 가치** | 중 | 기존에 없는 개념/프로세스 포함 여부 |

### 11.5 관련 C-Suite 역할 확장

#### CMO — SEO 흡수

기존 `vais-seo` 스킬을 CMO 역할로 통합:

```
CMO 산출물 확장:
  docs/05-marketing/{f}.md          ← 기존 마케팅 콘텐츠
  docs/05-marketing/{f}-seo.md      ← SEO 감사 리포트 (신규)
    - Title/Meta 최적화
    - Semantic HTML 체크
    - Core Web Vitals 가이드
    - 검색엔진 가시성 점수
```

트리거 키워드: `landing`, `마케팅`, `배포 전`, `검색 노출`, `SEO`

#### CSO — Plugin Validation 흡수

기존 `vais-validate-plugin` 스킬을 CSO 역할로 통합:

```
CSO 산출물 확장:
  docs/04-qa/{f}-security.md            ← 기존 보안 검토
  docs/04-qa/{f}-plugin-validation.md   ← 플러그인 검증 리포트 (신규)
    - 마켓플레이스 배포 요구사항 체크
    - 플러그인 코드 안전성 스캔
    - Skill/Agent/Hook 구조 규격 준수
    - disallowedTools 설정 검토
```

트리거 키워드: `plugin 배포`, `마켓플레이스`, `플러그인 검증`, `배포 준비`

**CSO가 Plugin Validation을 담당하는 이유**: 플러그인 배포는 "이게 안전하게 남의 환경에 들어가도 되는가"라는 질문 — 보안 게이트키핑 역할과 일치함.

### 11.6 구현 위치

```
vais-claude-code/
├── .vais/
│   └── absorption-ledger.jsonl     ← 흡수 이력 (신규, gitignore)
│
├── lib/
│   └── absorb-evaluator.js         ← 평가 로직 (신규)
│
└── skills/vais/phases/
    └── absorb.md                   ← /vais absorb 스킬 정의 (신규)
```

### 11.7 `/vais absorb` 명령 예시

```bash
# 단일 파일 평가
/vais absorb ../bkit/skills/gap-detector.md

# 디렉토리 전체 스캔
/vais absorb ../gstack/skills/

# 흡수 이력 확인
/vais absorb --history

# 중복만 필터해서 확인
/vais absorb --history --filter=rejected
```

---

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-03-31 | 최초 작성 — C-Suite 초안 |
| v2.0 | 2026-03-31 | 전면 확장 — 8개 C-Suite 역할 + marketingskills |
| v3.0 | 2026-04-01 | **플랫폼 재설계** — 6-레이어 아키텍처, State/Event Layer, MCP Server, Dashboard 레이어 추가 |
| v3.1 | 2026-04-01 | Section 10 추가 — Reference Absorption System (흡수 평가 + Ledger 관리) |
| v3.2 | 2026-04-01 | CEO → 레퍼런스 흡수 지시/승인 역할. CMO → SEO 통합. CSO → Plugin Validation 통합 |
| v3.3 | 2026-04-01 | Section 10 추가 — 전체 Skill/Layer 맵. /vais auto deprecated |
