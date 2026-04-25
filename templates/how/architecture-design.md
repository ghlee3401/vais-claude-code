---
artifact: architecture-design
owner_agent: infra-architect
phase: how
canon_source: "Martin Fowler 'Patterns of Enterprise Application Architecture' (2003), Addison-Wesley + Sam Newman 'Building Microservices' (2021, 2nd ed.) + Eric Evans 'Domain-Driven Design' (2003)"
execution:
  policy: always
  intent: architecture-design
  prereq: [prd, strategy-kernel]
  required_after: [api-implementation, db-schema]
  trigger_events: []
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: true
project_context_reason: "How 단계 — PRD 의 요구사항을 기술 아키텍처로 변환. 시스템 구조·계층·통합 결정. review_recommended=true: 잘못된 아키텍처는 후행 비용 100x."
---

# Architecture Design

> **canon**: Martin Fowler *Patterns of Enterprise Application Architecture* (2003) — 50+ 검증된 enterprise 아키텍처 패턴. Newman *Building Microservices* (2021) — distributed system 의 trade-off. Evans *DDD* (2003) — 도메인 기반 경계 설정.
>
> **목적**: PRD 요구사항을 **계층 / 컴포넌트 / 통합 / 데이터 흐름** 의 4 측면으로 분해. 후행 작업 (db-schema / api-implementation / ui-implementation) 의 입력.

---

## 1. Architecture Style

| 옵션 | 적정 시점 |
|------|----------|
| **Monolith** | 1~5 인 / 단일 도메인 / pre-PMF |
| **Modular Monolith** | 5~15 인 / 복수 도메인 / 모듈 간 명확한 경계 |
| **Microservices** | 15+ 인 / 도메인 분리 + 독립 배포 필요 |
| **Serverless** | 트래픽 spiky / event-driven 워크로드 |

**Selected Style**: ______ (이유 명시 — 팀 크기 / 복잡도 / 배포 빈도)

## 2. Layer Decomposition (Fowler PoEAA)

| Layer | 책임 | 예시 (본 프로젝트) |
|-------|------|-------------------|
| **Presentation** | UI / API gateway / CLI | ______ |
| **Application** | use case orchestration / transaction boundary | ______ |
| **Domain** | 비즈니스 로직 / entities / value objects | ______ |
| **Infrastructure** | DB / 외부 API / 메시징 | ______ |

## 3. Component + Integration Diagram

```
┌──────────┐   ┌──────────┐   ┌──────────┐
│ Component│──▶│ Component│──▶│ External │
│    A     │   │    B     │   │   API    │
└──────────┘   └──────────┘   └──────────┘
      │                              ▲
      └──────────────────────────────┘
```

(Mermaid / ASCII / Excalidraw 링크)

## 4. Data Flow

| 단계 | From → To | Protocol | 데이터 |
|:---:|----------|:--------:|--------|
| 1 | UI → API | HTTPS/REST | request body |
| 2 | API → Domain | function call | DTO |
| 3 | Domain → DB | SQL/ORM | entity |
| 4 | DB → Domain | SQL | resultset |

## 5. Architecture Decisions (ADR-style)

| # | Decision | Trade-off | Rationale |
|:-:|---------|-----------|-----------|
| ADR-1 | (예: PostgreSQL 채택) | (vs MongoDB / vs MySQL) | (정합성 + 트랜잭션 / JSON 지원) |
| ADR-2 | (예: REST 채택, GraphQL 거절) | (vs GraphQL / vs gRPC) | (단순성 + 클라이언트 다양성) |

---

## (작성된 sample)

**Project**: VAIS Code Plugin (CLI/Plugin 도구)

### 1. Architecture Style

**Selected**: **Monolith** (단일 plugin, 1인 운영)
**이유**: 1 인 개발자 + Claude Code marketplace 단일 plugin 형식 + 외부 의존 minimal (Anthropic API 만). microservice 는 over-engineering.

### 2. Layer Decomposition

| Layer | 본 프로젝트 |
|-------|------------|
| Presentation | `skills/vais/SKILL.md` (CLI) + `output-styles/vais-default.md` (output rendering) |
| Application | `agents/{c-level}/{c-level}.md` (orchestration) + `lib/c-level-context.js` |
| Domain | `lib/project-profile.js` (Profile schema + 게이트) + `lib/auto-judge.js` |
| Infrastructure | Anthropic Claude API + 로컬 파일 시스템 (`docs/{feature}/{NN-phase}/`) + git |

### 3. Component Diagram (Mermaid)

```mermaid
graph LR
  User --> Skill[skills/vais/SKILL.md]
  Skill --> CLevel[6 C-Level agents]
  CLevel --> SubAgent[44 sub-agents]
  CLevel --> ProjectProfile[lib/project-profile.js]
  ProjectProfile --> Catalog[catalog.json]
  CLevel --> Hooks[hooks/*.js]
  Hooks --> Status[.vais/status.json]
  CLevel --> Docs[docs/{feature}/]
  SubAgent --> Anthropic[Anthropic Claude API]
```

### 4. Data Flow

| 단계 | From → To | 데이터 |
|:---:|----------|--------|
| 1 | User → Skill | `/vais cto do {feature}` |
| 2 | Skill → CTO agent | feature + phase + Project Profile |
| 3 | CTO → Sub-agent | task + scope_conditions |
| 4 | Sub-agent → Anthropic | system prompt + user message |
| 5 | Anthropic → Sub-agent | output |
| 6 | Sub-agent → docs/_tmp/ | scratchpad write |
| 7 | CTO → docs/03-do/main.md | 큐레이션 + topic 분리 |

### 5. ADR

| # | Decision | Trade-off | Rationale |
|:-:|---------|-----------|-----------|
| ADR-1 | Node.js CJS 유지 (TypeScript 거절) | TS 타입 안전 vs JS 단순성 | 1인 운영 / 작은 코드베이스 / 학습 곡선 최소화 |
| ADR-2 | clevel-coexistence (multiple C-Level main.md 공유) | 단일 owner vs append-only conflict | 메타-피처 (CPO+CTO 동시 기여) 지원 필요 |
| ADR-3 | sub-doc preservation (_tmp/ 영구 보존) | git 용량 증가 vs 추적성 | 의사결정 큐레이션 추적 (Rule 14) |
| ADR-4 | feature flag profileGateEnabled: false 기본 | safe rollout vs immediate value | backwards compat + 점진 활성화 (R6 완화) |

---

## 작성 체크리스트

- [ ] Architecture Style 이 **팀 크기 / 복잡도 / 배포 빈도** 기반으로 선택되었는가?
- [ ] 4 Layer (Presentation / Application / Domain / Infrastructure) 모두 본 프로젝트로 instantiate?
- [ ] Component Diagram 이 **시각화 (Mermaid / ASCII / 도구 링크)** 포함하는가?
- [ ] Data Flow 가 **단계별 protocol + 데이터 형식** 명시?
- [ ] ADR (Architecture Decision Records) 가 **3+ decision** 으로 trade-off + rationale 명시?
- [ ] PRD (`prereq`) 의 요구사항이 architecture 에 흐르고 있는가?
- [ ] Strategy Kernel (`prereq`) 의 Coherent Action 과 정합?
- [ ] **Boundary 명확** (Evans DDD): Domain 영역과 Infrastructure 가 분리?

---

## ⚠ Anti-pattern

- **Premature Microservices**: 1~5 인이 microservice 시작 — 운영 복잡성 폭증. Newman 명시 경고: "if you're not big enough, microservices will hurt you."
- **Database-driven Design**: DB schema 부터 → 도메인 무시 → tightly coupled. Evans DDD 경고. **Domain 중심 + DB 는 Infrastructure**.
- **God Component**: 단일 컴포넌트가 모든 책임 — Single Responsibility 위반. 분해 필요.
- **ADR 부재**: decision 만 적고 trade-off / rationale 없음 — 6개월 후 "왜 이렇게 했지?" 못 답. **trade-off 명시 필수**.
- **시각화 부재**: 글로만 설명 — 신규 개발자 onboarding 비용 100x. Mermaid 최소.
- **Layer Leakage**: Presentation 이 Domain 우회하고 DB 직접 — 추후 변경 비용 폭증.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 12. Fowler PoEAA + Newman + Evans DDD 정전. Architecture Style + 4 Layer + Component Diagram + Data Flow + ADR + sample (VAIS Code 자기 참조) + checklist 8 + anti-pattern 6 |
