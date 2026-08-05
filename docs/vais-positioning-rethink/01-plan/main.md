---
owner: cpo
artifact: main
phase: plan
feature: vais-positioning-rethink
---

# vais-positioning-rethink — Plan 인덱스

## Executive Summary

vais-code 의 v0.66 본 sprint scope 를 *제품 기획 시각* 으로 정의. CEO ideation 에서 도출된 정체성 ("부서장 매뉴얼 organization-in-a-box") + 로드맵 v2 (M0+M1 → Target-app 부분 → ...) 을 기반으로 — Plan phase 는 기회 → 부재 갭 → M0+M1 spec → 사용자 페르소나 → 성공 기준의 인과 사슬을 박제. PRD (Do phase) 작성 전 합의 단계.

## Decision Record

| Date | Decision | Owner | Source |
|------|----------|-------|--------|
| 2026-05-09 | v0.66 핵심 기회 = "PO 가 부서장 역할을 할 때 부족한 다학제 도메인 지식·운영 매뉴얼·의사결정 패턴" 의 박제 (CEO ideation 정체성 인용) | CPO (plan) | plan-rationale §1 |
| 2026-05-09 | v0.66 sprint scope = M0 (Ideation Continuity) + M1 Tier-1 6 개. M0 인프라 박힌 후 M1 콘텐츠 박제 (self-application 검증) | CPO (plan) | plan-rationale §2 |
| 2026-05-09 | 1 차 사용자 페르소나 = "1 PO 본인" (dogfood 우선). 2 차 페르소나 = "외부 1 PO/founder" (v0.67 Target-app Bootstrap 부분 후 유입). 팀/기업 페르소나는 v0.70+ | CPO (plan) | plan-rationale §3 |
| 2026-05-09 | M0 성공 기준 = (a) 세션 종료/재개 후 5 분 내 컨텍스트 회복 (b) commit 시 ideation 자동 박제 (c) 사용자 명시 부담 0. M1 성공 기준 = (d) dogfood 시 vanilla CC plan 대비 차별화 입증 (e) 6 개 framework 모두 OJT 깊이 충족 (4 요소: framework + 실무단계 + 의사결정패턴 + 산출물양식) | CPO (plan) | plan-rationale §4 |
| 2026-05-09 | Plan phase 완성도 자가 점검 = 80% (5 핵심 항목: 기회/범위/페르소나/성공기준/리스크 모두 명시). PRD 8 섹션 (Do phase) 진입 가능 | CPO (plan) | plan-rationale §5 |
| 2026-05-09 | **CTO 기술 변환 — CP-0 분기 = "full"** (PRD 8/8 섹션 + 부록 7 종 PASS). 자동 로드, CP-0 미발동. plan-standard 템플릿 자동 선택 (다중 도메인: hooks/lib/agents/docs/.vais) | CTO (plan) | cto-tech-plan §1 |
| 2026-05-09 | **5 Minor 이슈 흡수** (qa-report §4 → cto-tech-plan §3): #1 Sprint Week 분할 v2 / #2 M1 박제 시간 추정 + Tier-1 우선순위 / #3 H4 lazy-load PoC Week 1 D1-2 / #4 H5 휴리스틱 검증 표본 30+ turn / #5 7.3 ↔ 7.4 정합 정리 | CTO (plan) | cto-tech-plan §3 |
| 2026-05-09 | **Sprint Plan v2 (4 주, Week 분할 재조정)** — W1 = M0 인프라 + lazy-load PoC. W2 = M1 첫 3 박제 (CEO/CPO/CTO). W3 = M1 나머지 3 (CSO/CBO/COO). W4 = 검증 + GA. 기존 v1 (Week 1 8 task) 의 부하 분산 | CTO (plan) | cto-tech-plan §4 |
| 2026-05-09 | **H4 Lazy-load PoC Spec** — Week 1 D1-2 에 CEO `rumelt-strategy-kernel.md` 1 개만 박제 (300 자 minimal stub) → CEO agent 호출 → context 주입 확인. PASS → 5 박제 GO. FAIL → manual `@include` fallback 즉시 전환 (R-3 완화) | CTO (plan) | cto-tech-plan §5 |
| 2026-05-09 | **Implementation 분해 (Plan ≠ Do)** — 본 plan 은 *기술 spec* 만. 실제 hook 구현·knowledge 박제는 Do phase. sub-agent 매핑: M0 인프라 = backend-engineer, M1 박제 = 각 C-Level (직접 위임), Lazy-load PoC = backend-engineer + qa-engineer 검증 | CTO (plan) | cto-tech-plan §6 |
| 2026-05-09 | **Plan 검토 후 Lean Rewrite 결정** — 7 critical 이슈 노출 (self-referential doc 폭증 / H4 PoC 부정확 / Tier-1B 도메인 부재 / PRD-Plan 정합 깨짐 / KR3 통계 + 주관성 / H1 자기 참조 / Sprint day 모호). PRD/Plan/QA v2.0 압축본 (1,759 → ~937 줄) | CPO+CTO (plan review) | review chat (turn 14~16) |
| 2026-05-09 | **Tier-1B 이동 (Critical #3 해결)** — CSO/CBO/COO 박제는 사용자 도메인 부재 → LLM-generated trap 회피. v0.67+ 외부 contributor 또는 사용자 직접 학습 후 박제. v0.66 = M1-A (CEO/CPO/CTO) 3 개만 | CPO (plan review) | PRD v2.0 §4 |
| 2026-05-09 | **H4 PoC 재정의 (Critical #2 해결)** — signature 등장 ≠ lazy-load. negative test 로 재정의: *파일명 변경 시 signature 가 사라지는가?* PASS = autonomous discovery 확인. FAIL = manual `@include` fallback 즉시 전환 | CTO (plan review) | PRD v2.0 §5 / cto-tech-plan v2.0 §2 |
| 2026-05-09 | **KR3 객관화 (Critical #5 해결)** — "주관적 1 회 비교" → "5+ 질문 풀, 박제 framework keyword 5+ grep vs vanilla CC". SMART M (Measurable) 충족 | CPO (plan review) | PRD v2.0 §3 |
| 2026-05-09 | **Sprint 단일 source (Critical #4 해결)** — Sprint Plan v2 = PRD §7 단독. cto-tech-plan §3 = "PRD 그대로 채택, 추가 분해 없음" 선언. v1/v2 정합 깨짐 해소 | CTO (plan review) | cto-tech-plan v2.0 §3 |

## Artifacts

| File | Type | Description |
|------|------|-------------|
| `01-plan/main.md` | 인덱스 | 본 문서 (CPO + CTO 공동) |
| `01-plan/plan-rationale.md` | 분석 (CPO) | 기회 / 범위 / 페르소나 / 성공 기준 / 리스크 통합 |
| `01-plan/cto-tech-plan.md` | 기술 spec (CTO) | Architecture / 5 minor 이슈 흡수 / Sprint v2 / H4 PoC / Implementation 분해 |

## CEO 판단 근거

본 phase 진입은 CEO ideation (turn 1~9) 의 명시적 권장 (`/vais cpo plan vais-positioning-rethink`) 에 따름. CEO 7 차원 알고리즘 호출은 ideation 모드 예외로 우회됨. CPO 활성화 근거 = ideation 결정 (Decision Record): "v0.66 = M0 + M1 박제 → PRD 로 spec 구체화 필요". 의존성 충족 (CPO 는 의존 없음 — CTO 보다 우선 가능).

## Next Phase

### Plan phase 완료 (Lean Rewrite v2.0 후) — 다음: **CTO design** 또는 **CTO do 직행**

PRD v2.0 + Plan v2.0 + QA v2.0 = ~937 줄 (1,759 에서 -47%). 7 critical 이슈 모두 처리.

다음 옵션:
- `/vais cto design vais-positioning-rethink` — infra-architect 단독 (CLI 기반 → ui-designer 생략). M0 hook 아키텍처 + status.json 스키마 확정
- 또는 `/vais cto do vais-positioning-rethink` — design 생략하고 W1 D1 lazy-load PoC 부터 즉시 진행 (Sprint v2 = 2 주, day 부족)

> ⚠️ Mandatory phase 순서: design → do → qa → report. 스킵 시 경고. CLI 도구 + lean rewrite 후 단순 hook 구현이라 design 생략 정당화 가능 (cto-tech-plan v2.0 정합).

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-09 | 초기 작성 — ideation 박제 후 CPO plan phase 진입. 5 Decision Record + plan-rationale.md 1 artifact |
| v2.0 | 2026-05-09 | CTO 기술 변환 추가 — CTO Decision Record 6 entries (CP-0 full / 5 minor 흡수 / Sprint v2 / H4 PoC / Implementation 분해) + cto-tech-plan.md artifact. Next Phase = CTO design |
| v3.0 | 2026-05-09 | **Lean Rewrite** — Plan 검토 후 7 critical 이슈 처리 (self-referential trap / H4 PoC negative test 재정의 / Tier-1B v0.67 이동 / Sprint 단일 source / KR3 객관 grep / H1 자기 참조 양해 / day 단위 명시). PRD 704→250, plan-rationale 186→80, cto-tech-plan 266→100, qa-report 156→60. 합계 1,759 → ~937 (-47%) |
