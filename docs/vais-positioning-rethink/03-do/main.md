---
owner: cpo
artifact: main
phase: do
feature: vais-positioning-rethink
---

# vais-positioning-rethink — Do (PRD) 인덱스

## Executive Summary

prd-writer 가 plan-rationale + ideation 박제를 입력으로 PRD 8 섹션 + 부록 7 종 (OKR, Sprint Plan, Pre-mortem, Stakeholder Map, User Stories, Job Stories, MoSCoW) 을 합성. 분량 704 줄. 핵심 방향: *vanilla CC 가 채울 수 없는 비-코드 부서장 영역의 OJT 매뉴얼 깊이 박제* 가 vais-code 의 진짜 차별화. CTO 핸드오프 컨텍스트 포함.

## Decision Record

| Date | Decision | Owner | Source |
|------|----------|-------|--------|
| 2026-05-09 | PRD 8 섹션 + 부록 7 종 모두 포함 (전체 부록) — vais-code 가 dogfood 검증 사례라 Pre-mortem/Sprint Plan/User Stories 모두 의미 있음 | CPO (do) | prd-writer 결과 |
| 2026-05-09 | design phase 생략 정당화 — vais-code 는 내부 도구라 OST/VPC/TAM 분석 over-engineering. plan-rationale 가 sub-agent 결과 충분히 synthesize | CPO (do) | plan-rationale §6 |
| 2026-05-09 | **H4 추가 가정 (prd-writer 발견)** — knowledge lazy-load 실제 동작 여부 미검증 (AC-M1-3 으로 검증, 미동작 시 manual include fallback). plan-rationale H1~H3 외 신규 | CPO (do) | prd-writer 4-2 |
| 2026-05-09 | OKR Key Results 5 개 = (1) M0 4 메커니즘 + 5 분 회복 입증 (2) M1 Tier-1 6/6 통과 (3) dogfood A/B 차별화 (4) CLAUDE.md 정체성 반영 (5) CHANGELOG v0.66 entry | CPO (do) | prd-writer 4 |
| 2026-05-09 | Sprint Plan = 4 주 (week 1 M0 인프라, week 2 M1 첫 3 framework, week 3 M1 나머지 3, week 4 dogfood + CLAUDE.md/CHANGELOG) | CPO (do) | prd-writer Sprint |
| 2026-05-09 | Must Have (MoSCoW) = M0 working-notes 자동 + Decision Record append + session-start 복원, M1 6 개 framework, CLAUDE.md 1 줄 추가. Should Have = 체크포인트 키워드. Could Have = OJT 깊이 cross-review. Won't Have = README/AGENTS 업데이트 (v0.67 후) | CPO (do) | prd-writer MoSCoW |
| 2026-05-09 | **PRD v2.0 Lean Rewrite** (Plan 검토 후) — 8 섹션 + 7 부록 → 8 섹션 본문 통합 (lean). M1 = Tier-1A 3 개만, Tier-1B v0.67+ 이동. KR3 객관화 (grep). H1, H4 핵심 2 가정만. Sprint v2 (4 주 → 2 주). 704 → ~250 줄 | CPO (do v2) | prd v2.0 |
| 2026-05-09 | **CTO Do W1 D1 — H4 PoC empirical 결정** — Step 1 진행 전 source-of-truth 증거 (vais.config.json 명세 "manual reference" / runtime 코드 부재 / CEO Index 미등재) 로 즉시 FAIL 판정. Step 2 negative test 불필요. **manual @include fallback 채택** | CTO (do W1D1) | poc-result.md |
| 2026-05-09 | **CEO ceo.md Knowledge Index 갱신** — *manual @include* 형식으로 변경. Rumelt Strategy Kernel entry 추가 (PoC stub). 모든 entry 에 *literal Read 지시* 명시 ("Read X 후 답변") | CTO (do W1D1) | agents/ceo/ceo.md (수정) |
| 2026-05-09 | **PoC 30 분 단축** — design §4 추정 (PASS ~1h / FAIL ~2h) 대비 empirical 증거로 ~30 분 완료. W1 D1 잔여 ~3.5h 으로 M0 status.json 스키마 + working-notes hook 작업 시작 가능 (계획보다 앞당김) | CTO (do W1D1) | poc-result.md §4 |
| 2026-05-09 | **CTO Do W1 D2 — M0 인프라 코드 박제** — `lib/status.js` 4 ideation helpers (set/get/list/clear) + `lib/llm-heuristic.js` 신규 (Claude Haiku wrapper, fail-safe SKIP fallback) + `lib/m0-record-turn.js` 신규 worker (transcript JSONL parse + LLM 휴리스틱 + working-notes append + Decision Record M0-②) + `scripts/stop-handler.js` 확장 (detached 자식 spawn — fire-and-forget). 총 ~315 줄 코드 추가 | CTO (do W1D2) | lib/m0-record-turn.js + lib/llm-heuristic.js |
| 2026-05-09 | **BC + 안전성 — Stop hook 무영향 정책** — ideation.inProgress=true + transcript_path 가용 시에만 worker spawn. detached + stdio:ignore 로 사용자 경험 영향 0. SDK 미설치/API 키 부재/timeout/JSON 파싱 실패 모두 default SKIP fallback. 본 vais-positioning-rethink ideation 은 inProgress=false (status.json 미존재 시 null) 라 hook 미동작 — 다음 ideation feature 에서 실제 검증 | CTO (do W1D2) | scripts/stop-handler.js + lib/llm-heuristic.js |

## Artifacts

| File | Type | Description |
|------|------|-------------|
| `03-do/main.md` | 인덱스 (CPO + CTO 공동) | 본 문서 |
| `03-do/prd.md` | PRD (CPO) | prd-writer 합성, 8 섹션 + 7 부록 → v2.0 lean (189 줄) |
| `03-do/poc-result.md` | PoC 결과 (CTO) | H4 lazy-load PoC empirical 결정 (manual @include 채택) |
| **코드 변경** (W1 D1) | `agents/ceo/ceo.md` Knowledge Index 갱신 + `agents/ceo/knowledge/rumelt-strategy-kernel.md` PoC stub | git 64e3801 |
| **코드 변경** (W1 D2) | `lib/status.js` (+4 ideation helpers) / `lib/llm-heuristic.js` (신규) / `lib/m0-record-turn.js` (신규 worker) / `scripts/stop-handler.js` (M0-① detached spawn) | 본 commit |

## CEO 판단 근거

CPO Plan Gate 완성도 5/5 (100%) 통과 → Do phase 진입. design phase 생략 — 사용자 명시 확인 (`AskUserQuestion: "CPO do (prd-writer) 진행"`). PRD 합성 입력 = ideation 박제 (Decision Record 13 + working-notes turn 1~9) + plan-rationale (6 섹션). 외부 design phase sub-agent (product-discoverer/strategist/researcher) 결과 없이도 prd-writer 가 입력 자료로 8 섹션 합성 가능.

## Next Phase

### CPO QA (PRD 완성도 검증)

PRD 의 8 섹션 + 7 부록이 완성도 ≥ 80% 인지 검증. 누락·모호 항목 보강. 정량 측정 (PRD 8/8 섹션 작성 + 부록 7/7).

### CPO Report (선택) — 또는 CTO 핸드오프 직행

prd-writer 가 이미 CTO 핸드오프 컨텍스트 (핵심 문제/타깃 사용자/성공 기준/기술 제약/H1~H4/Must Have) 을 작성. CPO 가 추가 report 없이 CTO plan 으로 핸드오프 가능.

### 권장 다음 단계

**CPO qa → CTO plan** 순서. 또는 **CTO plan 직행** (PRD 가 정량 spec 으로 충분).

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-09 | 초기 작성 — prd-writer 결과 인덱스. PRD 704 줄, 8 섹션 + 7 부록 |
