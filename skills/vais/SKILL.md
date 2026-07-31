---
# 이 파일의 책임: `/vais` 진입점 — 액션 라우팅 + 공통 규칙. v2.0 (plan→do→review)
name: vais
description: >
  Development workflow with per-feature document history (plan → do → review),
  living guidelines, and brand-styled HTML report/deck generation.
  Use when: starting a feature (plan), implementing (do), verifying (review),
  checking status, committing, or generating an HTML report/slide deck.
  Triggers: vais, /vais plan, /vais do, /vais review, /vais status, /vais commit, /vais report, /vais deck, /vais brief.
  Do NOT use for: simple questions, casual conversation, tasks unrelated to this project's workflow.
argument-hint: "[action] [feature]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TodoWrite, AskUserQuestion
---

# VAIS v2.0 — $0 $1

## 액션

| 액션 | 설명 |
|------|------|
| `plan {feature}` | 착수 — 범위·접근·완료 조건을 `docs/{feature}/plan.md`로 |
| `do {feature}` | 구현 — 필요 시 sub-agent 병렬 위임. `--design` 플래그로 UI 설계 선행 |
| `review {feature}` | 검증 — 완료 조건 대조 + `review.md` + 지침 승격 루프 |
| `status` | 진행 상태 조회 |
| `init [feature]` | 기존 프로젝트에 VAIS 문서 구조 적용 |
| `commit` | 변경 분석 → Conventional Commits 메시지 → 사용자 확인 후 커밋 |
| `brief {주제} [--deck]` | 임원/대외 보고용 HTML 보고서·슬라이드 — 소재는 대화·제공 자료 (`skills/brief/SKILL.md`) |
| `report {feature}` / `deck {feature}` | 피처 문서 기반 HTML 보고서 / 슬라이드 덱 (`skills/report/SKILL.md`) |
| `brand new` | 커스텀 브랜드 DESIGN.md 생성 (사내 CI·개인 스타일 — `skills/report/SKILL.md`) |
| `help` | 사용법 |

## 실행

1. `${CLAUDE_PLUGIN_ROOT}/skills/vais/phases/$0.md` 를 Read. 없으면 `utils/$0.md`. 둘 다 없으면 `/vais help` 안내.
2. `report`/`deck`/`brand` 는 `${CLAUDE_PLUGIN_ROOT}/skills/report/SKILL.md`, `brief` 는 `${CLAUDE_PLUGIN_ROOT}/skills/brief/SKILL.md` 를 Read.

## 공통 규칙

- 시작 시 `guidelines/code-conventions.md` + `guidelines/doc-conventions.md` Read (없으면 스킵).
- 문서는 `docs/{feature}/` 에 **plan.md / notes.md / review.md 3파일만** — 형식·상한은 doc-conventions 참조.
- 피처명: 영문 kebab-case 2~4단어, 의도가 드러나게 (`payment-retry-logic` ⭕ / `payment` ❌). 한국어 요청은 변환.
- phase 순서: plan → do → review. plan 없이 do 진입 시 확인 1회 후 plan부터.
- **scope probe**: plan 진입 전에 30분 내 직접 편집으로 끝나는 작업인지 판단 — 그렇다면 "문서 없이 바로 실행할까요?" 제안.
- 작업 중 유의미한 결정·발견은 즉시 `notes.md`에 한 줄 append.
- 사용자 결정이 필요한 분기만 AskUserQuestion — 확인 의식을 만들지 않는다.

## 완료 시

phase 완료 시 3줄 이내로 마무리: 작업 요약 1~2줄 + 다음 단계 제안 1줄 (`/vais {다음액션} {feature}`). 강제 포맷·박스 없음.
