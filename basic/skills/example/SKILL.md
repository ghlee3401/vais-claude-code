---
name: example
description: >
  예시 스킬. plan, implement, review 액션을 제공합니다.
  Triggers: example, /example plan, /example implement, /example review
argument-hint: "[action] [feature-name]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TodoWrite
---

# Example Skill — $0 $1

> 이 스킬은 harness engineering 참조 구현의 예시입니다.

## 현재 상태 파악

`.state/status.json`을 읽어 현재 진행 중인 피처와 단계를 확인하세요.
파일이 없으면 새 프로젝트입니다.

## 액션 목록

| 액션 | 설명 |
|------|------|
| `plan [feature]` | 기획서 작성 — orchestrator 에이전트 호출 |
| `implement [feature]` | 구현 — orchestrator → executor 에이전트 호출 |
| `review [feature]` | 검토 — Gap 분석 및 리포트 생성 |
| `status` | 현재 진행 상태 확인 |

## 실행 방법

### plan
```
/example plan login
```
→ orchestrator 에이전트를 호출하여 `docs/plan/login.plan.md` 생성

### implement
```
/example implement login
```
→ orchestrator가 executor를 호출하여 `src/login/` 구현

### review
```
/example review login
```
→ 기획서 대비 구현 Gap 분석 후 `docs/review/login.review.md` 생성

## 공통 규칙

- 피처명은 kebab-case 영문 (`login`, `user-profile`, `payment`)
- 문서는 한국어 작성 (기술 용어는 원어 유지)
- 각 단계 완료 후 `.state/status.json` 업데이트

## 에이전트 라우팅

```
plan     → Agent(orchestrator) → docs/plan/
implement → Agent(orchestrator) → Agent(executor) → src/
review   → Agent(orchestrator) → docs/review/
```
