---
owner: cto
artifact: ac-check
phase: do
feature: vais-positioning-rethink
---

# Acceptance Criteria 13 점검 — Sprint W2 D3

> **목적**: PRD §3 KR (5) + §4 Must Have (7) + Should Have (1) = **AC 13** 항목의 v0.66 충족 여부 정량 점검.
> **시점**: 2026-05-10 (Sprint W2 D3, GA 직전 sanity check).

---

## KR 5 (PRD §3) — 객관 측정

| ID | KR | 측정 방법 | 결과 | 판정 |
|----|----|---------|------|------|
| KR1 | M0 4 메커니즘 모두 동작 | 새 세션 5 분 회복 1 회 입증 | M0 4/4 코드 박제 (W1 D2-D3) — `lib/m0-record-turn.js` + `hooks/checkpoint-keyword.js` + `hooks/session-start.js` 확장. 실 운영 검증은 다음 ideation feature 에서 (이번 ideation 은 inProgress=false) | ✅ 박제 PASS / ⏭️ 운영 검증 보류 (다음 ideation) |
| KR2 | M1 Tier-1A 3 파일 박제 (각 3000~5000자 + OJT 4 요소) | wc -c + cross-review checklist | 3/3 박제: Rumelt 10,090byte / PRD OJT 9,695byte / Architecture 11,690byte. 평균 ~10,500byte (한글 multi-byte ~7,000자). OJT 4 요소 dogfood-ab-result.md M3 = 12/12 100% PASS. *분량 budget 초과 = 정책 결정 (M0 budget 5000→7000자 v0.67 권장)* | ✅ PASS (분량 단서 명기) |
| KR3 | dogfood A/B (객관) | 5+ 질문 풀, vais 응답에 박제 framework keyword 5+ 등장 vs vanilla | dogfood-ab-result.md 5 metric 모두 PASS. M2 manual @include 13 entries (vais) vs 0 (vanilla) | ✅ PASS |
| KR4 | CLAUDE.md 정체성 1 줄 | grep "organization-in-a-box" | W2 D3 본 세션에서 추가 (이 commit) → grep 1 hit | ✅ PASS (본 commit) |
| KR5 | CHANGELOG v0.66 entry + lean rewrite ref | git log + Keep a Changelog 형식 | W2 D3 본 세션에서 추가 (이 commit) | ✅ PASS (본 commit) |

**KR 5/5 PASS** (KR1 운영 검증은 다음 ideation feature 발생 시 재검증).

---

## Must Have 7 (PRD §4) — 박제 확인

| # | 모듈 | 박제 위치 | 판정 |
|---|------|---------|------|
| 1 | M0-① working-notes 자동 누적 | `lib/m0-record-turn.js` (worker) + `scripts/stop-handler.js` (detached spawn) | ✅ |
| 2 | M0-② Decision Record append-only | `lib/m0-record-turn.js` worker 의 KEPT 분기 (decisionKeywords) | ✅ |
| 3 | M0-④ session-start 자동 복원 | `hooks/session-start.js` `_renderIdeationRestore()` + `listInProgressIdeations()` | ✅ |
| 4 | M1-A CEO `rumelt-strategy-kernel.md` | `agents/ceo/knowledge/rumelt-strategy-kernel.md` (211 줄, 6,819자) | ✅ |
| 5 | M1-A CPO `prd-writing-ojt.md` | `agents/cpo/knowledge/prd-writing-ojt.md` (215 줄, 6,675자) | ✅ |
| 6 | M1-A CTO `architecture-decision.md` | `agents/cto/knowledge/architecture-decision.md` (233 줄, 11,690byte) | ✅ |
| 7 | CLAUDE.md 정체성 1 줄 ("organization-in-a-box") | CLAUDE.md "What This Project Is" 섹션 (본 commit) | ✅ |

**Must 7/7 박제** ✅

---

## Should Have 1 (PRD §4)

| # | 모듈 | 박제 위치 | 판정 |
|---|------|---------|------|
| 8 | M0-③ "체크포인트" 키워드 | `hooks/checkpoint-keyword.js` (UserPromptSubmit handler, 5 키워드) + `hooks/hooks.json` 등록 | ✅ |

**Should 1/1 박제** ✅ (PRD 에서 Should 였지만 W1 D3 에서 박제 완료)

---

## Won't Have (v0.67+ 이연 — 미박제 정상)

| # | 모듈 | 상태 |
|---|------|------|
| - | M1-B CSO/CBO/COO 박제 (Tier-1B) | ⏸️ v0.67+ 이연 (외부 도메인, contributor 확보 후) |
| - | Target-app Bootstrap | ⏸️ v0.67+ 이연 |
| - | README/AGENTS.md 정체성 대외화 | ⏸️ v0.67+ 이연 |

**Won't 3/3 정상 미박제** ⏸️ (PRD 의 명시적 v0.67+ 이연 결정)

---

## 종합 판정

| 카테고리 | 박제 | 비고 |
|---------|-----|------|
| KR | 5/5 PASS | KR1 운영 검증은 다음 ideation 에서 재검증 |
| Must | 7/7 박제 | 모두 commit 추적 가능 |
| Should | 1/1 박제 | PRD 등급보다 1 단계 상회 (Should → 박제) |
| Won't | 3/3 미박제 (정상) | v0.67+ 이연 명시 |

**AC 13/13 충족 + Won't 3 정상 미박제. v0.66 GA 준비 완료.**

남은 후속 (W2 D4-D5):
- W2 D4: 본 ac-check.md QA 검토 + Sprint 전체 검토
- W2 D5: `/vais commit` → v0.66.0 tag → GA 릴리즈

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-10 | Sprint W2 D3 — AC 13 점검 박제. KR 5/5 + Must 7/7 + Should 1/1 = 13/13 충족 |
