---
owner: cto
agent: cto-direct
artifact: frontmatter-spec
phase: plan
feature: simplify-non-cto-workflow
generated: 2026-05-02
summary: "sub-agent 가 박제하는 모든 artifact MD 의 표준 frontmatter 8 필드 정의. C-Level 이 본문 안 읽고 인덱싱 가능."
---

# Frontmatter Spec — sub-agent artifact MD 표준

## 한 줄 요약

8 필드 표준 frontmatter. C-Level 이 main.md 작성 시 본문 안 읽고 frontmatter 만으로 인덱스 생성 가능.

## 표준 필드 (8개)

| Field | Type | Required | 설명 | 예시 |
|-------|------|:--------:|------|------|
| `owner` | enum | ✅ | 어느 C-Level 산출인지 (`ceo` / `cpo` / `cto` / `cso` / `cbo` / `coo`) | `cpo` |
| `agent` | string | ✅ | 어느 sub-agent slug 가 작성했는지. C-Level 직접 작성 시 `{c-level}-direct` | `prd-writer` |
| `artifact` | string | ✅ | 무슨 artifact 인지. 파일 stem 과 일치 필수 (예: 파일 `prd.md` → `artifact: prd`) | `prd` |
| `phase` | enum | ✅ | 어느 phase 에서 박제 (`ideation` / `plan` / `design` / `do` / `qa` / `report`) | `plan` |
| `feature` | string | ✅ | 어느 피처 (kebab-case) | `payment-flow` |
| `source` | string | ⚠️ Conditional | 외부 거장 source. 외부 자료 흡수한 sub-agent 만 명시. 자체 작성 (예: backend-engineer) 은 생략 가능 | `"Cagan 'Inspired' (2017)"` |
| `generated` | date (ISO 8601) | ✅ | 생성 시각 (YYYY-MM-DD) | `2026-05-02` |
| `summary` | string | ✅ | 한 줄 요약 (≤200자). C-Level 이 main.md 인덱싱 시 본문 대신 참조 | `"결제 흐름 요구사항 — OAuth 2.0 + Tokenization"` |

## 예시

### 외부 자료 흡수 sub-agent

```yaml
---
owner: cpo
agent: prd-writer
artifact: prd
phase: plan
feature: payment-flow
source: "Cagan 'Inspired' (2017) + Lenny Rachitsky PRD Template"
generated: 2026-05-02
summary: "결제 흐름 요구사항 — OAuth 2.0 + PCI-DSS Tokenization 채택"
---

# PRD — payment-flow

## 1. Background
...
```

### 자체 작성 sub-agent (외부 source 없음)

```yaml
---
owner: cto
agent: backend-engineer
artifact: api-implementation-log
phase: do
feature: payment-flow
generated: 2026-05-02
summary: "Express.js 결제 API 구현 — POST /api/payment / GET /api/payment/:id"
---

# Implementation Log — Backend
...
```

### C-Level 직접 작성 (sub-agent 없음)

```yaml
---
owner: cto
agent: cto-direct
artifact: architecture
phase: design
feature: payment-flow
generated: 2026-05-02
summary: "결제 시스템 아키텍처 — 게이트웨이 분리, 큐 기반 비동기, 멱등성 보장"
---

# Architecture — payment-flow
...
```

## 검증

- `scripts/doc-validator.js` 가 각 artifact md 의 frontmatter 8 필드 검사
- `owner` ∉ enum → ERROR
- `phase` ∉ enum → ERROR
- `artifact` ≠ 파일 stem → ERROR
- `summary` > 200자 → WARN
- `source` 누락 시 → 외부 자료 sub-agent 인지 frontmatter 의 agent 필드로 판단 (sub-agent md 의 canon_source 와 cross-check)

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | 표준 8 필드 정의. 예시 3 종 (외부 자료 / 자체 / C-Level 직접). 검증 룰. |
