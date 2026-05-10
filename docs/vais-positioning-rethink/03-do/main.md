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
| 2026-05-10 | **CTO Do W1 D3 — M0-③ + M0-④ 완성** — `hooks/checkpoint-keyword.js` 신규 (UserPromptSubmit 핸들러, 키워드 5종 감지 + main.md Decision Record 마지막 3 + working-notes 마지막 entry 추출 → additionalContext) + `hooks/session-start.js` 확장 (`listInProgressIdeations` 호출, in-progress 발견 시 5 줄 요약 prepend) + `hooks/hooks.json` UserPromptSubmit 등록 1 항목. 모든 실패 silent pass-through. Smoke test PASS (키워드 감지 + Decision Record 추출). | CTO (do W1D3) | hooks/checkpoint-keyword.js + hooks/session-start.js |
| 2026-05-10 | **M0 4 메커니즘 코드 박제 완료** — ① working-notes 자동 누적 (Stop hook 확장 + worker) / ② Decision Record append (worker 의 KEPT 분기) / ③ "체크포인트" 키워드 (UserPromptSubmit 신규) / ④ session-start 자동 복원 (기존 hook 확장). M1-A 박제 (W1 D4-D5 + W2 D1-D3) 부터 본격 dogfood 검증 가능 | CTO (do W1D3) | M0 4/4 통합 |
| 2026-05-10 | **CTO Do W1 D4 — M1 CEO Rumelt 정식 박제** — PoC stub (~25 줄) → 정식 OJT 매뉴얼 (211 줄, 6,819 자). 4 요소 충족: §1 Framework 정의 (Strategy Kernel + Bad Strategy 4 함정) + §2 5 Step 워크숍 (Diagnosis/Policy/Actions/Cascade/Self-deception) + §3 의사결정 패턴 (5 질문 체크리스트) + §4 ADR 양식. R-1 완화: §5 vais-positioning-rethink 자기 적용 사례 (Lean Rewrite = Step 5 의 실증). 5000자 budget +36% — OJT depth 우선 | CTO (do W1D4) | agents/ceo/knowledge/rumelt-strategy-kernel.md |
| 2026-05-10 | **CEO ceo.md Knowledge Index 갱신** — Rumelt entry 의 "PoC stub" 표기 제거 + OJT 4 요소 요약 추가. 정식 박제 반영 | CTO (do W1D4) | agents/ceo/ceo.md |
| 2026-05-10 | **CTO Do W1 D5 — M1 CPO PRD Writing OJT 정식 박제** — `agents/cpo/knowledge/prd-writing-ojt.md` 신규 (215 줄, 6,675 자). OJT 4 요소: §1 PRD framework (8 섹션 의미 + 부록 7 종) + §2 5 Step 작성 OJT (JTBD 인터뷰 + Working Backward + 작성 순서 + Lean Review) + §3 의사결정 패턴 (흔한 실수 7 + 부록 결정 매트릭스 + 5 질문 체크리스트) + §4 양식 (PRD template + 좋은/나쁜 예). R-1 완화: §5 vais-positioning-rethink PRD v1→v2 Lean Rewrite 경험 (실수 1/5/6 발생 + 회피) | CTO (do W1D5) | agents/cpo/knowledge/prd-writing-ojt.md |
| 2026-05-10 | **CPO cpo.md Knowledge Index 갱신** — manual @include 형식 적용 (W1 D1 의 ceo.md 와 일관성). 기존 3 entry + PRD Writing OJT 1 entry 추가 = 4 entries | CTO (do W1D5) | agents/cpo/cpo.md |
| 2026-05-10 | **OJT 4 요소 분량 budget 재검토** — Rumelt 6,819자 + PRD OJT 6,675자 = 평균 ~6,750자. PRD §2.2 의 "각 3000~5000 자" budget 은 비현실적 (OJT 4 요소 충족 시 자연 6000~7000자). 향후 sprint 에서 budget 조정 권장 (5000 → 7000자) | CTO (do W1D5) | budget 재검토 (PRD §2.2 vs 실측) |

## Artifacts

| File | Type | Description |
|------|------|-------------|
| `03-do/main.md` | 인덱스 (CPO + CTO 공동) | 본 문서 |
| `03-do/prd.md` | PRD (CPO) | prd-writer 합성, 8 섹션 + 7 부록 → v2.0 lean (189 줄) |
| `03-do/poc-result.md` | PoC 결과 (CTO) | H4 lazy-load PoC empirical 결정 (manual @include 채택) |
| **코드 변경** (W1 D1) | `agents/ceo/ceo.md` Knowledge Index 갱신 + `agents/ceo/knowledge/rumelt-strategy-kernel.md` PoC stub | git 64e3801 |
| **코드 변경** (W1 D2) | `lib/status.js` (+4 ideation helpers) / `lib/llm-heuristic.js` (신규) / `lib/m0-record-turn.js` (신규 worker) / `scripts/stop-handler.js` (M0-① detached spawn) | git fc7883b |
| **코드 변경** (W1 D3) | `hooks/checkpoint-keyword.js` (신규 M0-③) / `hooks/session-start.js` (M0-④ ideation 복원 확장) / `hooks/hooks.json` (UserPromptSubmit 등록) | 본 commit |

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
