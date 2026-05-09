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

## Artifacts

| File | Type | Description |
|------|------|-------------|
| `01-plan/main.md` | 인덱스 | 본 문서 (CPO + CTO 공동) |
| `01-plan/plan-rationale.md` | 분석 (CPO) | 기회 / 범위 / 페르소나 / 성공 기준 / 리스크 통합 |
| `01-plan/cto-tech-plan.md` | 기술 spec (CTO) | Architecture / 5 minor 이슈 흡수 / Sprint v2 / H4 PoC / Implementation 분해 |

## CEO 판단 근거

본 phase 진입은 CEO ideation (turn 1~9) 의 명시적 권장 (`/vais cpo plan vais-positioning-rethink`) 에 따름. CEO 7 차원 알고리즘 호출은 ideation 모드 예외로 우회됨. CPO 활성화 근거 = ideation 결정 (Decision Record): "v0.66 = M0 + M1 박제 → PRD 로 spec 구체화 필요". 의존성 충족 (CPO 는 의존 없음 — CTO 보다 우선 가능).

## Next Phase

### Plan phase 완료 — 다음: **CTO design**

CPO plan 은 PRD 8 섹션 + 부록 7 종으로 완료 (Do phase 03-do/). CTO plan 은 본 main.md + cto-tech-plan.md 로 완료 (기술 spec 박제, 코드 X — Plan ≠ Do).

다음: `/vais cto design vais-positioning-rethink` — ui-designer + infra-architect 병렬. vais-code 는 CLI 기반이라 ui-designer 의 wireframe 의미 약함 — infra-architect 단독으로 M0 hook 아키텍처 설계 + .vais/status.json 스키마 확정. Design 후 do 에서 실제 구현.

> ⚠️ Mandatory phase 순서: design → do → qa → report. 스킵 금지. Lazy-load PoC 는 design phase Gate 1 통과 조건 (cto-tech-plan §5).

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-09 | 초기 작성 — ideation 박제 후 CPO plan phase 진입. 5 Decision Record + plan-rationale.md 1 artifact |
| v2.0 | 2026-05-09 | CTO 기술 변환 추가 — CTO Decision Record 6 entries (CP-0 full / 5 minor 흡수 / Sprint v2 / H4 PoC / Implementation 분해) + cto-tech-plan.md artifact. Next Phase = CTO design |
