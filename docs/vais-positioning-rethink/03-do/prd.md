---
owner: cpo
agent: prd-writer
artifact: prd
phase: do
feature: vais-positioning-rethink
generated: 2026-05-09
summary: "vais-code 정체성을 '부서장 매뉴얼(organization-in-a-box)'로 재정의. v0.66 = M0 (Ideation Continuity 4 메커니즘) + M1 Tier-1A 3 framework (CEO/CPO/CTO 자기 도메인). Tier-1B 는 v0.67+ 로 이동."
---

# PRD — vais-positioning-rethink (v0.66)

> Lean PRD — 1,759 줄 검토 후 7 critical 이슈 노출 → v2.0 압축본. 정체성 입증의 첫 self-application.

## 1. Summary

**v0.66 = M0 (Ideation Continuity 4 메커니즘) + M1 Tier-1A (CEO/CPO/CTO 3 framework)**. Tier-1B (CSO/CBO/COO) 는 외부 도메인 contributor 확보 전까지 v0.67+ 로 이동 (LLM-generated trap 회피).

**비즈니스 목표**: vanilla CC 가 채울 수 없는 *부서장 OJT 매뉴얼 깊이* 박제. 본 sprint 의 Lean Rewrite 자체가 *vais-code 가 자기 비판 받아 행동 가능* 의 첫 dogfood.

## 2. Background

### 화두 (ideation turn 1)

> "vais-code 가 templates 의존하고 너무 많은 문서 만들고 있지 않나? 어떤 앱을 개발할 때 그 앱의 CLAUDE.md 자동 관리 필요."

### 정체성 (ideation turn 5~6 결정)

> **vais-code = 1 PO 가 부서장 7 영역 (기획/운영/전략/PM/문서/팀원지시/개발) 결정 시 부족한 다학제 도메인 지식·운영 매뉴얼·의사결정 패턴의 박제 (organization-in-a-box).**

### 왜 지금

- CC native (plan/review/parallel) 진화 → 코드 영역 redundancy
- 본 ideation 자체가 1,759 줄 doc 박제 → 화두 재현 → Lean Rewrite 로 답
- M0 부재 노출 → 컨텍스트 휘발 위험 (이번 박제로 일부 검증 시작)

## 3. Objective + KR

**Objective**: v0.66 sprint 내에 "부서장 매뉴얼" 정체성을 dogfood 으로 검증하되, *plan 자체가 화두 위반하지 않게* lean 으로 박제한다.

**KR (5개, 객관 측정)**:

| ID | KR | 측정 |
|----|----|------|
| KR1 | M0 4 메커니즘 모두 동작 | 새 세션 5 분 회복 1 회 입증 |
| KR2 | M1 Tier-1A 3 파일 박제 (각 3000~5000 자 + OJT 4 요소) | wc -c + cross-review checklist |
| KR3 | dogfood A/B (객관) | 5+ 질문 풀, vais 응답에 박제 framework keyword 5+ 등장 vs vanilla |
| KR4 | CLAUDE.md 정체성 1 줄 | grep "organization-in-a-box" |
| KR5 | CHANGELOG v0.66 entry + lean rewrite ref | git log + Keep a Changelog 형식 |

## 4. Scope (Must / Won't)

### Must Have (v0.66)

| 모듈 | 내용 |
|------|------|
| M0-① working-notes 자동 누적 | 매 turn LLM 휴리스틱 → 1~3 줄 append (hook) |
| M0-② Decision Record append-only | 결정 키워드 감지 → main.md 표 append |
| M0-④ session-start 자동 복원 | in-progress ideation 감지 + 5 줄 요약 + AskUserQuestion |
| M1-A CEO `rumelt-strategy-kernel.md` | Diagnosis-Guiding-Coherent + 실무 워크숍 + ADR-style 결정 양식 |
| M1-A CPO `prd-writing-ojt.md` | PRD 8 섹션 OJT + JTBD 인터뷰 + 작성 순서 |
| M1-A CTO `architecture-decision.md` | System design 5 단계 + ADR 양식 + trade-off 패턴 |
| CLAUDE.md 정체성 1 줄 | "organization-in-a-box" |

### Should Have

- M0-③ "체크포인트" 키워드 (이번 ideation 에서 미사용 확인)
- CHANGELOG v0.66 entry

### Won't Have (v0.66 — v0.67+ 이동)

- M1-B CSO/CBO/COO 박제 (외부 도메인 — LLM-generated trap 회피, contributor 확보 후)
- Target-app Bootstrap
- README/AGENTS.md 정체성 대외화

## 5. Solution + 기술 제약

### M0 동작 흐름

```
[assistant turn 종료]
  → hook: post-assistant-turn (신규)
  → LLM 휴리스틱 (kept/skip)
  → fs append working-notes.md (M0-①)
  → 결정 감지 → Decision Record append (M0-②)

[새 세션 시작]
  → hook: session-start (확장)
  → status.json.ideation.inProgress 감지
  → 5 줄 요약 출력
  → AskUserQuestion (M0-④)
```

### M1 lazy-load 메커니즘 (H4 PoC 우선)

v0.65 Wisdom Split 패턴 = *설계 완료, 동작 미검증*. v0.66 W1 D1 PoC 로 검증.

**PoC 재정의 (검토 #2 반영)**: signature 등장 ≠ lazy-load. 진짜 검증 = **negative test** — *stub 의 파일명을 바꾸면 signature 가 사라지는가?*

| 시나리오 | 결과 |
|---------|------|
| `rumelt-strategy-kernel.md` → 정상 위치, signature 등장 | autonomous discovery 의심 |
| 파일명 → `rumelt-x.md` 로 변경, signature 부재 | ✅ true lazy-load 확인 |
| 파일명 변경, signature 그대로 등장 | ❌ agent 가 다른 경로로 접근 — manual @include 필요 |

PASS → M1-A 3 박제 진행. FAIL → manual `@include` fallback (agent .md 의 Knowledge Index 명시 지시문) 즉시 전환.

### 기술 제약

| 항목 | 요구 |
|------|------|
| Node.js | 18+ (CJS hooks) |
| `.vais/status.json` 스키마 | `ideation.inProgress`, `lastTurn`, `mainMdPath` 필드 추가 |
| Hook 신설 | `hooks/post-assistant-turn.js` (M0-①, ②) |
| Hook 확장 | `hooks/session-start.js` (M0-④) |
| 박제 위치 | `agents/{c-level}/knowledge/{name}.md` |
| 박제 분량 | 각 3,000~5,000 자 |

## 6. Assumptions (검증 필요, 핵심 2 만)

| ID | 가정 | 검증 | 리스크 |
|----|------|------|--------|
| H1 | OJT 4 요소가 vanilla CC 차별화 입증 | KR3 객관 grep 5+ 질문 | 상 (자기 참조 함정 — v0.67 외부 검증 보강 권장) |
| H4 | lazy-load autonomous discovery 동작 | W1 D1 negative test PoC | 상 (FAIL 시 manual fallback 즉시 전환) |

> H2 (M0 self-application), H3 (외부 페르소나 v0.67 후), H5 (휴리스틱 표본) 은 본 sprint 자연 검증 → ceremony 제거.

## 7. Sprint Plan v2 — 2 주

### Week 1 (M0 인프라 + lazy-load PoC)

| Day | Task | DoD |
|-----|------|-----|
| D1 | **lazy-load PoC** (negative test) | PASS/FAIL 결정 |
| D2 | `.vais/status.json` 스키마 + working-notes hook (M0-①) | append 동작 확인 |
| D3 | Decision Record append (M0-②) + session-start 복원 (M0-④) | 새 세션 복원 확인 |
| D4 | "체크포인트" 키워드 (M0-③, Should) | 발화 → 부분 정리 + 세션 유지 |
| D5 | M1 CEO `rumelt-strategy-kernel.md` 정식 박제 | 4 요소 + 분량 |

### Week 2 (M1-A 마무리 + GA)

| Day | Task | DoD |
|-----|------|-----|
| D1-2 | M1 CPO `prd-writing-ojt.md` | 4 요소 + 분량 |
| D3 | M1 CTO `architecture-decision.md` | 4 요소 + 분량 |
| D4 | dogfood A/B (KR3 객관) + CLAUDE.md 정체성 | grep 통과 + 5+ 질문 풀 |
| D5 | CHANGELOG v0.66 entry + git tag v0.66.0 | release 완료 |

### Fallback (3 시나리오)

| 시나리오 | Fallback |
|---------|---------|
| W1 D1 PoC FAIL | manual `@include` 전환. M1-A 박제는 *include 지시문 박힌 형태* |
| M1-A 3 개 미완 | 미완 framework 만 v0.66.1 patch. KR2 partial 측정 |
| KR3 dogfood 시간 부족 | A/B 를 v0.66.1 로 미루고 v0.66.0 = "M0 + M1-A 박제" 만 |

## 8. Pre-mortem (핵심 2 만)

| ID | 리스크 | 완화 |
|----|--------|------|
| R-1 | M1-A 박제 분량 미완 / OJT 깊이 부족 (LLM-generated 수준) | "내가 막혔던 실제 경험" 1~2 개 명시 삽입 의무. 1 framework × 4 시간 hard limit |
| R-3 | H4 lazy-load 미동작 (PoC FAIL) | manual `@include` 즉시 fallback. 박제 형식만 변경 (콘텐츠 동일) |

## 9. Job Stories (핵심 4)

```
When 1 PO 가 전략 결정해야 하는데 Rumelt 방식 모를 때,
I want CEO agent 에게 물어보면 Diagnosis-Guiding-Coherent 인과 사슬로 분석,
So I can 결정 근거를 stakeholder 에게 ADR 형식으로 설명할 수 있다.

When 1 PO 가 PRD 8 섹션 작성해야 하는데 어디부터인지 모를 때,
I want CPO agent 가 8 섹션 OJT + JTBD 인터뷰 스크립트 제공,
So I can 빈 페이지 공포 없이 매주 PRD 작성 가능하다.

When 1 PO 가 아키텍처 결정 부담될 때,
I want CTO agent 가 system design 5 단계 + ADR 양식 적용,
So I can trade-off 명시한 ADR 로 결정 추적성 확보한다.

When ideation 세션이 길어져 중간에 끊어야 할 때,
I want 아무 것도 안 해도 context 자동 보존,
So I can 다음 세션에서 5 분 내 재개 가능하다.
```

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-09 | 초기 작성 — 8 섹션 + 7 부록 (704 줄) |
| v2.0 | 2026-05-09 | **Lean Rewrite** — 7 critical 이슈 보완 (Tier-1B v0.67 이동, KR3 객관화 grep, H4 PoC negative test, R-5 흡수, AC/H 압축, ceremony 제거). 704 → ~250 줄 |
