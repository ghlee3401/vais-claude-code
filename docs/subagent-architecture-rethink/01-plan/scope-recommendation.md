---
owner: cpo
topic: scope-recommendation
phase: plan
feature: subagent-architecture-rethink
---

# Topic: 범위 분석 — 4단계 프레임 채택 + 3가지 범위 비교

## 1. 메타-프레임 채택 근거 (D-1, D-2)

### 1.1 *제품의 탄생* 4단계가 1차 메타-프레임인 이유

| 평가 척도 | 근거 |
|----------|------|
| 다른 정전과의 정합성 | Rumelt(Strategy Kernel) / Doerr(OKR) / Christensen(JTBD) / Cagan(Discovery-Delivery) / Torres(OST) / Osterwalder(BMC) / Skelton(Team Topologies) / DORA / Google SRE — 모두 4단계(Core/Why/What/How) 안에 자연 매핑 |
| 단계 간 명확한 인과 | Core(존재이유) → Why(누구를 어떤 상태로) → What(무엇을) → How(어떻게) — 거꾸로 가지 않는 단방향 |
| 한국 SaaS 맥락 적합성 | 사용자 신뢰 정전 (사용자가 직접 채택) |
| 6.4/7.5/8.4 alignment 활동 명시 | 단계 간 "맞춤-개선" 활동이 명시되어 있어 누락된 메커니즘 식별 가능 |

### 1.2 메타-원칙 "산출물이 sub-agent 정의·경계·계약을 결정한다"

이 원칙이 작동하면:
- **분리**: 산출물이 다른 표준(SWOT vs PEST)이면 sub-agent 분리 정당화
- **통합**: 산출물 표준이 같으면 sub-agent 통합 후보
- **계약**: 산출물의 입력·출력·검증이 곧 sub-agent의 contract
- **정체성**: "이 sub-agent는 무엇을 만드는가?"가 곧 "무엇을 하는가?"

→ release-engineer 사례를 5분해(release-notes-writer / ci-cd-configurator / container-config-author / migration-planner / runbook-author)로 풀어낸 것이 이 원칙의 시범 적용.

## 2. 3가지 범위 후보 (CP-1 선택지)

### A. 최소 범위 — Project Profile + 정책 schema + 시범 1건

**포함**:
- Project Profile schema 확정 + ideation hook 통합
- Template metadata schema (frontmatter `execution.policy`) 확정
- release-engineer 5분해 시범 — 5개 신규 sub-agent + 5개 template (depth c)
- 산출물 카탈로그는 1차 인덱스만 (50+ 항목 목록, template 미작성)

**산출물량**: 신규 sub-agent 5개 + template 5개 + Profile schema 1개

**적합**: 검증 시범으로 빠르게 확인하고 싶을 때. 메타-원칙이 실제로 작동하는지 1건만 보고 결정.

**리스크**: 시범 1건만으로는 다른 sub-agent의 anti-pattern이 같은 패턴인지 검증 불충분.

---

### B. 표준 범위 ← **권장**

**포함 (A에 추가)**:
- 의심 sub-agent 5개 추가 재정의 (infra-architect / test-engineer / seo-analyst / finops-analyst / compliance-auditor)
- 산출물 카탈로그 우선순위 25개 template (depth c) 작성
  - Core 5개 (Vision / Strategy Kernel / OKR / PR-FAQ / 3-Horizon)
  - Why 5개 (PEST / Five Forces / SWOT / JTBD / Persona)
  - What 5개 (Lean Canvas / BMC / NSM / Roadmap / Pricing Tier)
  - How 5개 (ADR / C4 / STRIDE / Test Plan / Runbook)
  - 사업·재무 5개 (3-Statement / Cohort / FinOps / Funnel / SEO Audit)
- Value Proposition Canvas → product-strategist 재매핑 (잘못된 매핑 정정)

**산출물량**: 신규/재정의 sub-agent 10개 + template 25개 + Profile schema 1개 + 메타데이터 schema 1개

**적합**: ideation에서 합의한 6개 메커니즘을 의미 있게 검증할 수 있는 최소 단위.

**리스크**: 작업량 중간. 4~6주 예상.

---

### C. 확장 범위 — 전체 카탈로그 + alignment 메커니즘

**포함 (B에 추가)**:
- 산출물 카탈로그 50+ 전체 template (depth c)
- 모든 44개 sub-agent에 대한 anti-pattern 점검 + 필요 시 재정의
- 단계 간 alignment 검증 메커니즘 (책 6.4/7.5/8.4 시스템화)
- 시스템 게이트 UX (사용자가 매 호출 묻지 않고도 정책 작동)
- ux-researcher 호출 — VAIS 사용자(외부)에게 인터뷰 → Profile schema/정책 검증

**산출물량**: template 50+ / sub-agent 44 점검 / alignment 메커니즘 / UX 검증

**적합**: 전략적 중요도가 높고 시간 투자 가능 시.

**리스크**: 작업량 폭증 (R1). 단일 phase로 처리 시 8~12주. 우선순위 분산 위험.

## 3. 권장 — B. 표준 범위

### 권장 근거

1. **메타-원칙 검증에 필요한 최소 N**: 시범 1건(A)은 우연일 수 있음. 5개 sub-agent + 25개 template은 패턴이 보편적인지 통계적으로 의미 있는 단위.
2. **작업량 통제 (R1 완화)**: 50+ 일괄(C)은 phase가 비대해져 quality 떨어짐. 25개로 한정하면 1개당 충분히 (c) 깊이 가능.
3. **확장 가능성 보존**: B 완료 후 후속 phase로 C의 잔여 항목(alignment 메커니즘 / 카탈로그 나머지 25개) 진행 가능. 강제 일괄 아님.

### 후속 phase 분리 권장

- C의 "alignment 메커니즘"은 **별도 피처**(`subagent-alignment-protocol`)로 분리.
- C의 "잔여 카탈로그 25개"는 **자연스러운 누적**으로 진행 (한 번에 일괄 작성 강요 X).
- 선반 보관된 epistemic contract / uncertainty reporting는 B 완료 후 사용 데이터 기반으로 도입 시점 판단.

## 4. 큐레이션 기록

| Source | 채택 | 거절 | 병합 | 추가 | 이유 |
|--------|:----:|:----:|:----:|:----:|------|
| ideation D-1, D-2 | ✅ | | | | 4단계 프레임 + 메타-원칙 승계 |
| ideation D-11 (선반) | | ✅ | | | epistemic contract 등은 본 plan OUT-OF-SCOPE — 후속 phase로 |
| ideation Open Question Q-1 | | | | ✅ | 의심 sub-agent 5개 재정의를 표준 범위 B에 포함 |
| ideation Open Question Q-5 | | | ✅ | | 우선순위 25개 명시 (Core/Why/What/How/사업·재무 각 5개) |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — CPO 범위 분석 |
