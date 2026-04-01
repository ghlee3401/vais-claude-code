# Plan: remove-chaining-syntax

**Feature**: remove-chaining-syntax  
**Created**: 2026-04-01  
**Phase**: plan  
**Status**: active

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | vais SKILL.md의 체이닝 문법(`:`, `+`)이 사용자에게 워크플로우 구성 부담을 주고, 향후 에이전트 자율 위임 구조와 충돌한다 |
| **Solution** | SKILL.md에서 체이닝 파싱 로직과 체이닝 예시를 제거하고, 각 phase 파일(phases/*.md)은 그대로 보존한다 |
| **Function / UX Effect** | 사용자는 개별 액션만 호출하며, 체이닝 조합 문법 없이 일관된 인터페이스를 갖게 된다 |
| **Core Value** | Phase 역할 명세는 에이전트 지식으로 유지되고, 워크플로우 구성은 에이전트 자율 판단으로 이동한다 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | 체이닝 문법은 오케스트레이터(CTO 등) 에이전트가 자율적으로 next phase를 결정하면 불필요. DSL보다 에이전트 추론이 더 유연하고 확장성 있음 |
| **WHO** | vais 플러그인 사용자 및 C-Suite 에이전트(CTO/CEO 등) |
| **RISK** | 기존에 체이닝 문법으로 사용하던 워크플로우가 없어지면 사용자가 직접 단계별로 호출해야 하는 불편 가능성 |
| **SUCCESS** | SKILL.md에서 체이닝 파싱 섹션 제거, phases/*.md 파일 전체 보존 확인 |
| **SCOPE** | `skills/vais/SKILL.md` 수정만. phases 파일 및 agents 파일은 변경 없음 |

---

## 1. 현재 상태 분석

### 1.1 제거 대상 (SKILL.md)

**액션 목록에서 제거할 항목:**
```
| `ceo:cpo:cto [feature]` | C-Suite 체이닝 — CEO 전략 → CPO PRD → CTO 기술 실행 |
| `ceo:cto [feature]`     | C-Suite 체이닝 — CEO 전략 → CTO 기술 실행 (CPO 생략) |
| `plan:design:architect` | 순차 체이닝 (`:` = 순차) |
| `frontend+backend`      | 병렬 체이닝 (`+` = 병렬) |
```

**제거할 섹션:**
```markdown
## 체이닝 파싱
1. `:` split → 순차 실행 큐
2. `+` 포함 → Agent 도구로 병렬 호출
3. 각 단계 전 이전 단계 문서 자동 참조
4. 실패 시 즉시 중단

## 병렬 에이전트 매핑
| 체이닝 | 에이전트 A | 에이전트 B |
|--------|-----------|-----------|
| `frontend+backend` | frontend | backend |
```

### 1.2 보존 대상

| 항목 | 위치 | 이유 |
|------|------|------|
| 각 phase 개별 액션 | SKILL.md 액션 목록 | 수동 호출 및 에이전트 위임의 진입점 |
| phases/*.md 파일 전체 | `skills/vais/phases/` | 에이전트가 각 phase 실행 시 참조하는 역할 명세 |
| agents/*.md 파일 전체 | `agents/` | C-Suite 에이전트 명세 |

---

## 2. 요구사항

| ID | 요구사항 | 우선순위 |
|----|----------|----------|
| FR-01 | SKILL.md "체이닝 파싱" 섹션 제거 | Must |
| FR-02 | SKILL.md "병렬 에이전트 매핑" 섹션 제거 | Must |
| FR-03 | SKILL.md 액션 목록에서 체이닝 형태 액션 제거 (`ceo:cpo:cto`, `plan:design:architect`, `frontend+backend` 등) | Must |
| FR-04 | `skills/vais/phases/` 디렉토리 내 모든 파일 보존 (수정 없음) | Must |
| FR-05 | 개별 액션 (plan, design, architect, ceo, cto 등)은 그대로 유지 | Must |

---

## 3. 변경 범위

**수정 파일:**
- `skills/vais/SKILL.md` — 체이닝 관련 섹션/행 제거

**변경 없음:**
- `skills/vais/phases/*.md` — 전체 보존
- `agents/*.md` — 전체 보존
- `skills/vais/SKILL.md` 나머지 내용 (실행 지침, 완료 아웃로 등)

---

## 4. 성공 기준

| 기준 | 확인 방법 |
|------|----------|
| SKILL.md에 `:` 체이닝 파싱 로직 없음 | 파일 grep |
| SKILL.md에 `+` 병렬 파싱 로직 없음 | 파일 grep |
| phases/ 디렉토리 내 파일 수 변화 없음 | ls 비교 |
| 개별 액션 (plan, design, cto 등) 여전히 존재 | SKILL.md 확인 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-01 | 초기 작성 |
