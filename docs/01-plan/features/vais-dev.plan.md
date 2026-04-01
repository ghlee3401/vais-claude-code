---
feature: vais-dev
status: plan
created: 2026-04-01
---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | `/vais cto`와 `/vais architect`가 같은 슬래시 커맨드 레벨로 노출되어, 전략층(C-suite)과 구현층(개발팀)의 계층 구조가 사용자에게 불명확하다 |
| **Solution** | 구현 단계 액션을 `/vais-dev` 스킬로 분리하여, 전략층(`/vais`)과 구현층(`/vais-dev`)의 2-tier 구조를 명확히 한다 |
| **Functional UX Effect** | 사용자는 "전략/방향 논의 → `/vais`", "코드 구현 → `/vais-dev`"로 명확히 구분하여 진입할 수 있다 |
| **Core Value** | vais 생태계 이름을 유지하면서 역할 계층을 커맨드 이름에서 자연스럽게 드러낸다 |

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 현재 `/vais`가 C-suite 오케스트레이션과 구현 단계를 혼재시켜 계층이 불명확함 |
| **WHO** | vais-code 사용자 (개발자) |
| **RISK** | 기존 `/vais plan` 사용자의 커맨드 변경 혼란 가능성 |
| **SUCCESS** | `/vais`는 전략, `/vais-dev`는 구현으로 역할이 명확히 분리됨 |
| **SCOPE** | 스킬 레이어 추가 + phases 이동. 에이전트 `.md` 파일 수정 없음 |

---

## 1. 배경 및 문제 정의

### 1.1 현재 구조

```
/vais ceo      ← C-레벨
/vais cto      ← C-레벨 (구현 에이전트 오케스트레이션)
/vais plan     ← 구현 단계
/vais architect ← 구현 단계
/vais backend  ← 구현 단계
/vais frontend ← 구현 단계
/vais qa       ← 구현 단계
```

C-suite 전략 에이전트와 구현 단계 액션이 같은 레벨로 노출됨.

### 1.2 목표 구조

```
/vais          → 전략/방향 레이어 (C-suite)
  ceo, cfo, cmo, cpo, coo, cso, cto
  + 공통 유틸: init, absorb, status, help

/vais-dev      → 구현 레이어
  plan, design, architect, backend, frontend, qa
  + 구현 유틸: report, commit, test, next, status, help
```

CTO는 `/vais`에 속하지만 내부적으로 `Agent` 도구를 통해 구현 에이전트를 호출하는 오케스트레이터 역할을 유지한다.

---

## 2. 요구사항

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| FR-01 | `skills/vais-dev/` 스킬 디렉토리 신설 | Must |
| FR-02 | `skills/vais-dev/SKILL.md` 작성 — 구현 레이어 진입점 | Must |
| FR-03 | `skills/vais-dev/phases/` 에 구현 단계 phase 파일 이동 | Must |
| FR-04 | `skills/vais/SKILL.md`에서 구현 단계 액션 제거, C-suite만 유지 | Must |
| FR-05 | `skills/vais/phases/`에서 구현 단계 파일 제거 | Must |
| FR-06 | `/vais-dev status`, `/vais-dev next`, `/vais-dev help` 유틸 포함 | Should |
| FR-07 | `/vais help`에 "구현은 `/vais-dev`를 사용하세요" 안내 추가 | Should |

### 2.2 이동 대상 phases

| 파일 | 이동 방향 |
|------|---------|
| `plan.md` | `vais/phases/` → `vais-dev/phases/` |
| `design.md` | `vais/phases/` → `vais-dev/phases/` |
| `architect.md` | `vais/phases/` → `vais-dev/phases/` |
| `backend.md` | `vais/phases/` → `vais-dev/phases/` |
| `frontend.md` | `vais/phases/` → `vais-dev/phases/` |
| `qa.md` | `vais/phases/` → `vais-dev/phases/` |
| `report.md` | `vais/phases/` → `vais-dev/phases/` |
| `commit.md` | `vais/phases/` → `vais-dev/phases/` |
| `test.md` | `vais/phases/` → `vais-dev/phases/` |
| `next.md` | `vais/phases/` → `vais-dev/phases/` |
| `status.md` | 양쪽 유지 (vais: 전체 상태, vais-dev: 구현 상태) |

### 2.3 `/vais`에 잔류하는 phases

| 파일 | 이유 |
|------|------|
| `ceo.md`, `cfo.md`, `cmo.md`, `cpo.md`, `coo.md`, `cso.md`, `cto.md` | C-suite 전용 |
| `absorb.md` | 전략 레퍼런스 흡수 |
| `init.md` | 프로젝트 초기화 (전략 레벨) |
| `help.md` | 유지 (vais-dev 안내 포함) |
| `status.md` | 유지 (전체 프로젝트 상태) |

### 2.4 비기능 요구사항

- 에이전트 파일(`agents/*.md`) 수정 없음 — 스킬 레이어만 변경
- CTO의 내부 Agent 호출 방식 변경 없음 (`vais-code:architect` 등 subagent_type 유지)
- 기존 docs 경로 구조 변경 없음 (`docs/01-plan/`, `docs/02-design/` 등)

---

## 3. 설계 방향

### 3.1 `/vais-dev` SKILL.md 구조

```yaml
name: vais-dev
description: >
  VAIS Code 구현 레이어. plan → design → architect → backend → frontend → qa 단계를 관리합니다.
  Triggers: vais-dev, plan, design, architect, backend, frontend, qa, 기획, 설계, 구현, 백엔드, 프론트엔드
argument-hint: "[action] [feature]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TodoWrite, AskUserQuestion
```

### 3.2 `/vais` SKILL.md 변경

- 액션 목록에서 구현 단계 제거
- C-suite + 유틸리티만 유지
- help에 `/vais-dev` 크로스 링크 추가

### 3.3 CTO 오케스트레이션 패턴 (변경 없음)

```
사용자 → /vais cto
              ↓ (Agent 도구)
         vais-code:architect
         vais-code:backend
         vais-code:frontend
         vais-code:qa
```

`/vais-dev`는 사용자 진입점이지, CTO의 내부 호출 경로가 아님.

---

## 4. Success Criteria

| 기준 | 검증 방법 |
|------|---------|
| `/vais-dev plan login` 실행 시 plan 단계가 정상 동작 | 실행 테스트 |
| `/vais plan` 실행 시 "구현은 `/vais-dev`를 사용하세요" 안내 출력 | 실행 테스트 |
| `/vais cto` 실행 시 CTO가 구현 에이전트 정상 오케스트레이션 | 실행 테스트 |
| `/vais` 액션 목록에 plan/design/architect/backend/frontend/qa 없음 | 코드 확인 |
| 에이전트 파일(`agents/*.md`) 미수정 | git diff 확인 |

---

## 5. 리스크

| 리스크 | 대응 |
|--------|------|
| 기존 `/vais plan` 사용 습관 | `/vais help`에 마이그레이션 안내 추가 |
| status.md 중복 유지로 인한 불일치 | 각각 역할 명시 (전체 상태 vs 구현 상태) |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-01 | 최초 작성 |
