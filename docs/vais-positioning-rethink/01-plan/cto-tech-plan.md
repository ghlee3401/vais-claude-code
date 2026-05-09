---
owner: cto
artifact: cto-tech-plan
phase: plan
feature: vais-positioning-rethink
---

# CTO Tech Plan — vais-positioning-rethink (v2.0 Lean)

> CTO 기술 변환 spec. Lean Rewrite 후 ~100 줄 목표. PRD v2.0 + qa-report v2.0 입력.

## §1. CP-0 + 템플릿

PRD v2.0 = "full" (8 섹션 압축, AC/H 객관화). 자동 로드, CP-0 미발동. 템플릿 = cto-tech-plan 단일 spec (lean).

## §2. Architecture Stack

### M0 (Ideation Continuity)

```
[assistant turn 종료]
  → hooks/post-assistant-turn.js (신규)
  → LLM 휴리스틱 → fs append working-notes.md (M0-①)
  → 결정 감지 → Decision Record append (M0-②)

[새 세션]
  → hooks/session-start.js (확장)
  → lib/memory.js readStatus → ideation.inProgress
  → 5 줄 요약 + AskUserQuestion (M0-④)
```

### M1-A (Knowledge Pack lazy-load)

v0.65 Wisdom Split 패턴 = 설계 완료, 동작 미검증. **W1 D1 negative test PoC** 우선:

| Test | 기대 |
|------|------|
| `rumelt-strategy-kernel.md` 정상 위치 → signature 등장 | autonomous discovery 의심 |
| 파일명 변경 (`rumelt-x.md`) → signature 부재 | ✅ true lazy-load |
| 파일명 변경, signature 그대로 | ❌ manual `@include` fallback 필요 |

## §3. Sprint v2 (PRD §7 동기화)

PRD §7 Sprint Plan 그대로 채택. 본 plan 에서 추가 분해 없음. 정합 source = PRD.

## §4. Implementation 분해 (Plan ≠ Do)

| 모듈 | sub-agent | 시점 |
|------|-----------|------|
| H4 PoC | backend-engineer + qa-engineer | W1 D1 |
| status.json 스키마 + M0 hooks | backend-engineer | W1 D2-3 |
| M0-③ 체크포인트 키워드 | backend-engineer | W1 D4 |
| M1-A 3 박제 | 각 C-Level 직접 (CEO/CPO/CTO) | W1 D5 + W2 D1-3 |
| CLAUDE.md + CHANGELOG | CTO + COO release-notes-writer | W2 D4-5 |
| dogfood A/B (KR3 객관) | PO + qa-engineer 보조 | W2 D4 |

> Plan ≠ Do 엄격 — 본 plan 에서 코드 변경 0. 모든 hook/MD 박제는 CTO Do phase.

## §5. R-1 완화 — LLM-generated trap 방지

각 M1-A 박제 시 사용자 의무:

1. "내가 막혔던 실제 경험" 1~2 개 명시 (placeholder 금지)
2. OJT 4 요소 자가 점검 — *(2) 실무 단계* 가 단순 이론 설명이면 다시 작성
3. cross-review: 박제 후 다른 C-Level 1 명이 *checker* — "이게 vanilla CC + 위키 수준인가?" 판정

## §6. Plan Gate

| 항목 | 충족 |
|------|------|
| PRD 정합 (Sprint v2 source = PRD) | ✅ |
| 5 critical 이슈 흡수 (Lean Rewrite v2.0 완료) | ✅ |
| H4 PoC = negative test 재정의 | ✅ |
| Tier-1B v0.67 이동 (도메인 부재 회피) | ✅ |
| Plan ≠ Do (코드 변경 0) | ✅ |
| Lean — 화두 응답 | ✅ (266 → ~100 줄) |

→ **6/6 = 100% PASS**. CTO design 진입 가능.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-09 | 초기 작성 — 5 minor 이슈 흡수 + Sprint v2 + H4 PoC + Implementation 분해 (266 줄) |
| v2.0 | 2026-05-09 | **Lean Rewrite** — Sprint 정의는 PRD 로 단일화 (정합 #4 해결), H4 PoC negative test 재정의 (#2 해결), Tier-1B v0.67 이동 (#3 해결), R-1 LLM-generated 완화 강화. 266 → ~100 줄 |
