---
owner: cpo
phase: design
feature: subagent-architecture-rethink
---

# subagent-architecture-rethink — 설계서

> **Design phase 인덱스**. 4 sub-agent (`product-discoverer` / `product-strategist` / `product-researcher` / `ux-researcher`) 병렬 위임 → CPO 큐레이션 → 5 topic 합성.

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **What changed in design** | 4 sub-agent 병렬 위임으로 OST 8 OPP / Lean Canvas + JTBD + Strategy Kernel / 경쟁 5 + 3 Persona / 인터뷰 가설 7 도출. 13개 design 결정(D-D1~D-D13) 확정 |
| **Most critical insight** | sub-agent 4명이 **공통적으로** Profile + 정책 4분류 + Template (c) + 4단계 프레임을 채택 — design 결정의 정합성이 자연 검증됨 |
| **Top 3 즉시 검증 가정** | Profile 게이트 통증 해소 / Profile UX 직관성 / 50+ template 14~22주 실현가능성 |
| **Do phase 핵심 작업** | PRD 8섹션 (정전 매핑) + Profile schema v1 + Template metadata schema + 신규 sub-agent 7개 |

---

## Decision Record (multi-owner)

> Plan 단계 D-1~D-8 승계. Design 단계 D-D1~D-D13 추가.

| # | Decision | Owner | Rationale | Source topic |
|---|----------|:-----:|-----------|--------------|
| D-1~D-8 | (Plan 단계) | cpo | (`docs/subagent-architecture-rethink/01-plan/main.md` 참조) | (plan topics) |
| D-D1 | 4단계 프레임 + 메타-원칙 일관 적용 (Sol-8-A) | cpo | discoverer + strategist 공통 | `key-design-decisions.md` |
| D-D2 | Profile + 정책 4분류 게이트 (Sol-1-A) | cpo | 4 sub-agent 공통 | `opportunity-tree.md` + `strategy-canvas.md` |
| D-D3 | Template depth (c) — sample+checklist+anti-pattern | cpo | discoverer + strategist + researcher 공통 | `key-design-decisions.md` |
| D-D4 | release-engineer 5분해 + 의심 5 sub-agent 정책 적용 | cpo | researcher 6개 정의 발췌 검증 + ux-researcher T2 시나리오 | `market-personas.md` + `key-design-decisions.md` |
| D-D5 | Alignment 메커니즘 α + β 조합 | cpo | discoverer Sol-7-A + strategist CA-7 | `opportunity-tree.md` |
| D-D6 | Project Profile schema v1 (12 변수) + ideation 종료 hook | cpo | 4 sub-agent 공통 | `key-design-decisions.md` 섹션 3.3 |
| D-D7 | VPC → product-strategist 재매핑 | cpo | 잘못된 매핑 정정 (D-9 plan 승계 + discoverer Sol-5-B) | `opportunity-tree.md` |
| D-D8 | CEO sub-agent 4개 신설 (vision-author / strategy-kernel-author / okr-author / pr-faq-author) | cpo | strategist H1 vision + researcher CEO 빈약 진단 | `strategy-canvas.md` |
| D-D9 | What 단계 sub-agent 1개 신설 (roadmap-author) | cpo | strategist H1 vision | `strategy-canvas.md` |
| D-D10 | OPP-6 (중복 배치)는 OPP-8 해소 시 자동 흡수 | cpo | discoverer 큐레이션 — 별도 솔루션 불필요 | `opportunity-tree.md` |
| D-D11 | P1 솔로 빌더용 "경량화 정전 가이드" 검토 | cpo | researcher Reference Canon 검증 (P1: 7/10 정전 적용) | `market-personas.md` (do phase 결정) |
| D-D12 | 인터뷰 전 즉시 적용 3가지: Profile 한 줄 예시 / 산출물 컨텍스트 컬럼 / `review_recommended` 메타필드 | cpo | ux-researcher 인터뷰 결과 없이도 즉시 가능 | `interview-plan.md` |
| D-D13 | "Always" 9개 적정성 — 인터뷰 H-2 카드 정렬로 검증 | cpo | ux-researcher H-2 가설 | `interview-plan.md` (qa 검증) |
| **D-IA-01** | `lib/project-profile.js` — js-yaml FAILSAFE_SCHEMA + 정규식 기반 scope_conditions 평가 (CEL 파서 OUT — D-T5 준수) | cto | YAGNI + 보안 (G-1) | `technical-architecture-design.md` |
| **D-IA-02** | hooks/ideation-guard.js → PostToolUse Write 훅 + 00-ideation/main.md Write 시 profile.yaml 초안 추출 + additionalContext 주입 | cto | hooks.json 기존 패턴 준수 | `technical-architecture-design.md` |
| **D-IA-03** | template-validator `--depth-check` 플래그로 (c) 깊이 3섹션 자동 검증 (sample 100자+/체크리스트 5+/anti-pattern 3+) | cto | SC-04 자동화 | `technical-architecture-design.md` |
| **D-IA-04** | catalog.json 빌더 — gray-matter scan + `templateToArtifact()` 변환. 정렬: phase → policy → id | cto | G-2 보완 — Approach B 채택 | `technical-architecture-design.md` |
| **D-IA-05** | alignment α — keyword recall 기반 (`|K_from ∩ K_to| / |K_from|`). v1 단순 recall, EXP-4 검증 후 v2 가중치 | cto | YAGNI 단순화 | `technical-architecture-design.md` |
| **D-IA-06** | 10개 신규 agent frontmatter `artifacts:` 필드 표준 — 메타-원칙 코드 수준 적용 | cto | "산출물이 sub-agent 정의" 강제 | `technical-architecture-design.md` |
| **D-IA-07** | container-config-author scope_condition을 `deployment.containerized` 대신 `deployment.target IN [cloud,hybrid,on-prem]` 사용 — Profile 변수 최소화 (12 유지) | cto | Profile schema 안정성 | `technical-architecture-design.md` |
| **D-IA-08** | release-engineer deprecate v0.59 (alias + redirect_to) → v0.60 제거 (CHANGELOG BREAKING) | cto | R4 완화 — alias 1 phase 유지 | `technical-architecture-design.md` |

---

## [CPO] 제품 설계 종합

### 4 sub-agent 합의의 의미

design phase에서 4명의 sub-agent가 **독립적으로 작업**했지만 **핵심 결정 6개에 자연 수렴**:
- D-D1 (4단계 프레임) — discoverer + strategist
- D-D2 (Profile + 정책 게이트) — 4명 모두
- D-D3 (Template (c)) — discoverer + strategist + researcher
- D-D4 (release-engineer 5분해) — discoverer + strategist + researcher + ux-researcher
- D-D5 (Alignment α + β) — discoverer + strategist
- D-D6 (Profile schema v1) — 4명 모두

→ **Plan 단계의 메커니즘이 다른 관점(통증발굴 / 전략 / 시장 / UX)에서도 검증됨**. 정합성 확보. ideation의 6 메커니즘 정렬에 이어 design에서 4명 cross-validation 추가.

### Top 3 즉시 검증 가정 (RA)

| 가정 | 카테고리 | 리스크 | 검증 |
|------|---------|:------:|-----|
| Profile 게이트가 실제 통증 해소 | User Value | 상 | EXP-1 + EXP-5 |
| Profile UX 직관성 (12 변수 인지부하) | Usability | 상 | think-aloud 3명 + T1 |
| 50+ template 14~22주 실현가능 | Feasibility | 상 | 5개 파일럿 sprint 측정 |

→ Do phase에서 EXP-1/EXP-2/EXP-3 즉시 실행 가능 (총 3.5~5시간).

### Do phase 인풋 골격

prd-writer에게 전달할 PRD 8섹션 골격은 `key-design-decisions.md` 섹션 3 참조. 핵심:
- Section 5 Market Segment → 3 Personas (P1/P2/P3) 사용
- Section 6 Value Proposition → JTBD + Geoffrey Moore + UVP "AI 의수"
- Section 7 Solution → 50+ 카탈로그 + Profile schema + 정책 4분류 + 신규 sub-agent 7개
- Section 8 Release → 3-Horizon (H1 now / H2 1~2년 / H3 3년+)

---

## [CTO] 기술 설계

### infra-architect 위임 결과

CPO design 산출물(PRD F1~F8 + 13 결정) + CTO plan (D-T1~D-T5)을 입력으로 **infra-architect** 위임 (`_tmp/infra-architect.md` 768 lines). 핵심 결과 8건 (D-IA-01~D-IA-08).

### 핵심 모듈 8개 인터페이스 확정

| 영역 | 신규/수정 | 핵심 함수 / 동작 |
|------|---------|--------------|
| `lib/project-profile.js` (신규) | 8 함수 (loadProfile / validateProfile / evaluateScopeConditions / buildContextBlock / isProfileGateEnabled 등) | js-yaml FAILSAFE 파싱 + 정규식 scope evaluator + secret 차단 (G-1 보안) |
| `hooks/ideation-guard.js` (수정) | PostToolUse Write 훅 | 00-ideation/main.md Write 시 profile.yaml 초안 추출 + additionalContext 주입 |
| `scripts/template-validator.js` (신규) | CLI + `--depth-check` | frontmatter schema + (c) 깊이 3섹션 자동 검증 (exit 0/1/2) |
| `scripts/build-catalog.js` (신규) | gray-matter scan | `templateToArtifact()` 변환 → catalog.json (정렬: phase→policy→id) |
| `lib/auto-judge.js` (수정) | `measureAlignmentAlpha()` | keyword recall 기반 (v1 단순, v2 가중치 — EXP-4 후) |
| 10 agent md frontmatter | 표준 `artifacts:` 필드 | 메타-원칙 코드 수준 적용 (D-D2 강제) |
| 3 template (c) 시범 | Vision / Strategy Kernel / OKR | 정전 출처 명시 + sample + 체크리스트 + anti-pattern |
| release-engineer deprecate | v0.59 alias + redirect → v0.60 제거 | R4 완화 |

### 의존성 그래프 (Mermaid 요약)

```
project-profile.js → paths.js + fs-utils.js + io.js (3개만)
catalog.json (생성물) ← project-profile.js (소비)
auto-judge.js → project-profile.js (Profile context 활용)
ideation-guard.js → project-profile.js (extractProfileDraft)
```

→ **순환 의존 없음**. 신규 의존성 2개(`js-yaml`, `gray-matter`)만 추가.

### EXP 검증 준비도

| EXP | 준비 상태 | 비고 |
|-----|---------|------|
| EXP-1 (Profile 게이트 30분) | ✅ | T-01~T-07 테스트 케이스 7개 도출 |
| EXP-2 (depth c 품질 1시간) | ✅ | template-validator `--depth-check` 자동 |
| EXP-3 (44 매트릭스 2~3시간) | ✅ | 매트릭스 Q-A/B/C/D 4기준 |
| EXP-4 (alignment α 70%) | ⚠ | v1 단순 recall 후 측정 — v2 가중치 추가 가능 |
| EXP-5 (외부 인터뷰 2~3주) | (CPO ux-researcher 위임) | — |

상세 — `technical-architecture-design.md`.

## Topic Documents (v0.57+)

| Topic | 파일 | Owner | 한 줄 요약 | 참조 scratchpad |
|-------|------|:-----:|-----------|----------------|
| Opportunity Solution Tree | `opportunity-tree.md` | cpo | 8 OPP / 16 Solution / 5 EXP / 8 RA category 매핑 | `_tmp/product-discoverer.md` |
| Strategy Canvas | `strategy-canvas.md` | cpo | Lean Canvas + JTBD + Strategy Kernel + SWOT + 3-Horizon | `_tmp/product-strategist.md` |
| Market & Personas | `market-personas.md` | cpo | 내부 진단 + 경쟁 5 + TAM/SAM/SOM + 3 Persona + Journey Map | `_tmp/product-researcher.md` |
| Interview Plan | `interview-plan.md` | cpo | 7 가설 + 45분 스크립트 + 7 슬롯 + UT 3 + Empathy Map | `_tmp/ux-researcher.md` + discoverer Q1~Q5 |
| **Key Design Decisions** | `key-design-decisions.md` | cpo | 4 sub-agent 통합 13 결정 + Top 3 RA + Do phase 작업 항목 | (4 sub-agent 종합) |
| **Technical Architecture** | `technical-architecture-design.md` | cto | 8 모듈 인터페이스 + 의존성 그래프 + 10 agent frontmatter spec + 3 template 시범 + deprecate 정책 | `_tmp/infra-architect.md` |

## Scratchpads (v0.57+)

| Agent | 경로 | 크기 | 갱신 |
|-------|------|:----:|-----|
| product-discoverer | `_tmp/product-discoverer.md` | 583 lines | 2026-04-25 |
| product-strategist | `_tmp/product-strategist.md` | 516 lines | 2026-04-25 |
| product-researcher | `_tmp/product-researcher.md` | 527 lines | 2026-04-25 |
| ux-researcher | `_tmp/ux-researcher.md` | 757 lines | 2026-04-25 |
| **infra-architect** | `_tmp/infra-architect.md` | ~768 lines | 2026-04-25 (CTO 위임) |
| **합계** | | **~3151 lines** | (영구 보존, git 커밋 — Rule #14) |

---

## Next

Do phase 진입 시 **CP-2 (Do 시작 전 실행 승인)** 적용:
- 호출 sub-agent: **prd-writer** (단독)
- 입력 컨텍스트: `01-plan/*.md` + `02-design/*.md` + `02-design/_tmp/*.md`
- 산출물: `docs/subagent-architecture-rethink/03-do/main.md` (PRD 8섹션, designCompleteness ≥ 80)
- 후속: CP-P (PRD 초안 후 방향 확인) → 필요 시 보완 → CP-Q (Check 후 CTO 핸드오프 결정)

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — CPO design phase, 4 sub-agent 병렬 위임 + 큐레이션 + 13 design 결정 |
| v1.1 | 2026-04-25 | CTO 진입: `## [CTO] 기술 설계` H2 섹션 append + D-IA-01~D-IA-08 결정 + technical-architecture-design.md topic + infra-architect _tmp 추가 |
