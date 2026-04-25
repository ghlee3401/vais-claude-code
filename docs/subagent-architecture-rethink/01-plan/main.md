---
owner: cpo
phase: plan
feature: subagent-architecture-rethink
---

# subagent-architecture-rethink — 기획서

> ⛔ **Plan 단계 범위**: 분석·결정·범위 합의만. 프로덕트 파일(skills/, agents/, templates/, lib/) 생성·수정은 Do 단계에서.

## Executive Summary

| Perspective | Content | Contributing C-Levels |
|-------------|---------|-----------------------|
| **Problem** | VAIS sub-agent 44개의 분리 기준이 C-Level마다 자의적이고, default-execute anti-pattern으로 "쓸데없이 산출물을 만들며", template·skill·계약(contract)이 명문화되지 않아 정체성과 경계가 흐리다 | cpo, ceo |
| **Solution** | *제품의 탄생* 4단계 메타-프레임 + "산출물이 sub-agent를 정의한다" 메타-원칙 + 산출물 실행 정책 4분류(A/B/C/D) + Project Profile + Template 표준화(depth c) | cpo, ceo |
| **Function/UX Effect** | sub-agent가 호출되어도 Project Profile·정책 게이트 통과 산출물만 작성. 사용자는 모르는 영역도 검증된 프레임워크 기반 산출물을 받음 | cpo |
| **Core Value** | 휴리스틱 제거 + 모름의 시스템적 처리 (mirror→prosthesis 전환) | ceo, cpo |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 사용자 지식 부족 ≠ 진짜 원인. **모름을 시스템에 내재화하는 프로토콜 부재**가 미성숙의 근본. release-engineer "쓸데없이 CI/CD 만든다"가 일반화된 anti-pattern의 살아있는 증거 |
| **WHO** | 1차: VAIS 사용자(본인) — sub-agent 호출 시 default-execute로 인한 마찰 / 2차: 외부 VAIS 사용자 — sub-agent 의도 파악 어려움 / 3차: VAIS 자체(메타-프로덕트) |
| **RISK** | (R1) 50+ 산출물 template 작성 작업량 폭증 / (R2) 단일 책(*제품의 탄생*) 정박 → 편향 / (R3) Project Profile schema가 과세분화·과소세분화 / (R4) 기존 44개 sub-agent 재구성이 사용자/외부 의존자에게 파괴적 |
| **SUCCESS** | SC-01~05 (Success Criteria 섹션 참조). 핵심: default-execute anti-pattern 해소 + 산출물 50+ 카탈로그 중 우선 25개 (c) 깊이 작성 + Project Profile 작동 |
| **SCOPE** | sub-agent 분류 원칙 + 산출물 카탈로그 + 실행 정책 + Project Profile + Template 표준화. **OUT**: epistemic contract / uncertainty reporting / absorb 대화 강제 (선반 보관, 후속 phase) |

---

## Decision Record (multi-owner)

| # | Decision | Owner | Rationale | Source topic |
|---|----------|:-----:|-----------|--------------|
| 1 | *제품의 탄생* 4단계(Core/Why/What/How)를 sub-agent 분류의 1차 메타-프레임으로 채택 | cpo | ideation D-1 승계 — 다른 정전과 cross-reference 시 충돌 없음 | `scope-recommendation.md` |
| 2 | 메타-원칙 "산출물이 sub-agent 정의·경계·계약을 결정한다" 채택 | cpo | ideation D-2 승계 — 휴리스틱 없는 귀납적 도출 가능 | `scope-recommendation.md` |
| 3 | 산출물 실행 정책 4분류(Always/Scope/User-select/Triggered)를 PRD 핵심 요구사항으로 확정 | cpo | ideation D-6 승계 — release-engineer 일반화 해법 | `mvp-scope.md` |
| 4 | Project Profile을 신규 산출물(메타데이터)로 정의 — schema·ideation 종료 시 합의 hook | cpo | ideation D-7 승계 — 정책 B(Scope)의 판단 근거 | `mvp-scope.md` |
| 5 | Template 작성 깊이는 (c)=sample+checklist+anti-pattern. 단, MVP는 우선순위 25개로 한정 | cpo | ideation D-5 + R1 리스크 완화 — 50+ 일괄은 작업량 폭증 | `mvp-scope.md` |
| 6 | epistemic contract / uncertainty reporting / absorb 대화 강제는 OUT-OF-SCOPE | cpo | ideation D-11 승계 — 구조 정돈 후 얹는 프로토콜 레이어 | `risk-and-yagni.md` |
| 7 | 단일 책 정박 리스크 완화: 4단계 프레임 + 6 C-Level별 정전 cross-reference 병행 | cpo | R2 리스크 완화 — Reference Canon (ideation 산출물) 활용 | `risk-and-yagni.md` |
| 8 | **C. 확장 범위 채택** — 카탈로그 50+ 전체 + 44 sub-agent 전체 점검 + alignment 메커니즘 + ux-researcher 외부 인터뷰 포함 | cpo | 사용자 CP-1 명시 결정. R1 리스크(작업량 폭증) 감수 | `extended-scope.md` |
| **D-T1** | NFR 임계값 확정 — Profile 게이트 latency < 50ms / template-validator < 1s / project-profile.yaml secret 차단 | cto | G-1 보완. P95 기준. CLI 응답 사용자 인지 한계 (Doherty Threshold 400ms) 적용 | `tech-implementation-plan.md` |
| **D-T2** | 카탈로그 data model — `templates/{section}/*.md` frontmatter scan + `catalog.json` 인덱스 빌더 (Approach B) | cto | G-2 보완. 50→100+ 확장 시 SQLite(C) 검토 | `tech-implementation-plan.md` |
| **D-T3** | vais.config.json `cSuite.{c-level}.subAgents` 업데이트 + package.json `claude-plugin > agents` 업데이트 — Sprint 7 작업 항목 명시 | cto | G-4 보완. infra-architect 책임 | `tech-implementation-plan.md` |
| **D-T4** | sub-agent 재정의 시 deprecate alias 정책 — release-engineer만 1 phase 유지 후 제거. 다른 6개(infra/test/seo/finops/compliance + copy-writer)는 in-place 수정 (분해 없음) | cto | R4 완화. release-engineer 5분해는 critical, 나머지는 정책 추가만 | `tech-implementation-plan.md` |
| **D-T5** | 기술 스택 — Node.js (CommonJS) + js-yaml + frontmatter parser (gray-matter) + Jest. CEL 파서 도입 X (D-2 YAGNI) | cto | 기존 lib/* 패턴 준수. 의존성 최소화 | `tech-implementation-plan.md` |

---

## [CTO] 기술 스케치

### 기술 핵심 도전

PRD F1~F8 (8 features) + 신규 sub-agent 7~10개 + template 25~50개를 **Sprint 1~14 (총 약 5개월)** 안에 14~22주 작업량으로 점진 누적. R1 (작업량 폭증) 가장 큰 리스크. 5개 파일럿 sprint로 RA-3 검증 후 잔여 일정 재조정.

### 기술 스택 (D-T5)

- Runtime: Node.js (CJS, lib/* 패턴 유지)
- YAML: `js-yaml` (Profile schema 파싱)
- Frontmatter: `gray-matter` (template metadata 파싱)
- Testing: Jest (기존)
- Validation: 자체 `template-validator.js` 신규
- **NOT used**: CEL 파서 (D-T5 — YAGNI), TypeScript (기존 CJS 유지)

### 핵심 구현 아키텍처

```
ideation 종료
   ↓ (hooks/ideation-guard.js)
docs/{feature}/00-ideation/project-profile.yaml
   ↓
[모든 C-Level 진입]
lib/project-profile.js (Context Load 자동 주입)
   ↓
sub-agent 호출 시 frontmatter execution.policy 평가
   ├─ A (Always): 무조건 작성
   ├─ B (Scope): scope_conditions evaluate(profile) → skip or 작성
   ├─ C (User-select): AskUserQuestion (intent 같은 alternates 다중 선택)
   └─ D (Triggered): 이벤트 발생 시만
   ↓
template (depth c) 기반 산출물 생성
   ↓
alignment α (auto-judge) 단계 전환 시 키워드 일치율 측정
```

### Plan-Plus (의도/대안/YAGNI)

- **의도 발견**: "AI agent가 호출되면 무조건 실행하는 기본 행동 패턴" 시스템 차원 anti-pattern. 본 피처는 release-engineer만 고치는 게 아니라 VAIS sub-agent 일반의 행동 모델 변경.
- **대안 탐색**: prompt 지시(거부 — 일관성 X), 시스템 confirmation 매번(거부 — 옵션 피로 R5), Profile + 정책(채택), sub-agent 갯수 감축(거부 — 자의적), 외부 ref 복제(거부 — 편향). → Profile + 정책 채택 (`risk-and-yagni.md` 섹션 4 승계).
- **YAGNI**: H2 도입 항목 (epistemic contract / uncertainty reporting / absorb 대화 강제) 모두 OUT-OF-SCOPE 유지. 50+ 카탈로그 일괄 작성도 25 우선 + 잔여 누적으로 압축.

### G-1/G-2/G-4 보완 (Gap 해소)

- **G-1 비기능 요구사항 (D-T1)**: NFR 표 신규 (`nfr-and-data-model.md`)
- **G-2 카탈로그 data model (D-T2)**: catalog.json 인덱스 빌더 (`nfr-and-data-model.md`)
- **G-4 vais.config.json (D-T3)**: Sprint 7 작업 항목 (`tech-implementation-plan.md` 섹션 4)
- (G-3은 PRD v1.1에서 해소됨)

### Impact Analysis (요약)

신규 5 / 수정 3 / 신규 template 25-50 / 신규 sub-agent 7~10 / Test 신규 ~30개 / vais.config.json + package.json 업데이트 (Sprint 7).

상세는 `cto-impact-schedule.md`. 

## [CPO] 제품 정의

### 핵심 메시지

이 피처는 **메타-프로덕트 리팩터링**이다. 외부 사용자에게 새 기능을 전달하는 게 아니라, VAIS의 sub-agent 계약·산출물·정책을 정전 기반으로 재정의하여 "쓸데없이 만든다" 통증을 시스템적으로 해소한다.

### Product Trio 관점 (Cagan)

- **Value (가치)**: sub-agent 호출 시 Profile/정책 게이트로 불필요한 산출물 차단. 검증된 프레임워크 기반 산출물 보장.
- **Usability (사용성)**: ideation 종료 시 Profile 1회 합의 → 이후 자동 게이트. 매번 묻기(옵션 피로) 회피.
- **Feasibility (실현가능성)**: 작업량 큰 영역(50+ template). MVP는 우선순위 25개로 한정.
- **Viability (사업성)**: VAIS 플러그인 자체의 신뢰성·외부 채택 가능성 향상. 정전 기반 산출물은 외부 협업/공유 시 즉시 이해됨.

### MVP 결정 (CP-1 사용자 선택 기다림)

3가지 범위 후보 — `scope-recommendation.md` 참조. 권장은 **B. 표준 범위**.

### 데이터 기반 분석 (data-analyst 호출 여부)

호출 **불필요** 판단. 이유: 메타-피처라 사용자 행동 데이터가 의미 없음. ideation 8턴 정성 통찰 + 정전 cross-reference로 충분. 단, Do 단계에서 "어떤 sub-agent가 실제로 호출됐는가" 로그 분석 필요 시 후속 호출 검토.

---

## Topic Documents (v0.57+)

| Topic | 파일 | Owner | 한 줄 요약 | 참조 scratchpad |
|-------|------|:-----:|-----------|----------------|
| 범위 분석 | `scope-recommendation.md` | cpo | 4단계 프레임 + 메타-원칙 채택 근거 + 3가지 범위(최소/표준/확장) 비교 | (없음 — CPO 직접) |
| MVP 범위 (B 표준) | `mvp-scope.md` | cpo | 산출물 카탈로그 우선순위 25개 + Project Profile MVP schema + 정책 4분류 적용 | (없음 — CPO 직접) |
| **확장 범위 (C 채택)** | `extended-scope.md` | cpo | C 채택분 — 카탈로그 50+ 전체 + 44 sub-agent 전체 점검 + alignment 메커니즘 + ux-researcher | (없음 — CPO 직접) |
| 성공 기준 | `success-criteria.md` | cpo | SC-01~10 측정 가능한 성공 기준 + 검증 방법 (확장 범위 SC-08~10 포함) | (없음 — CPO 직접) |
| 리스크·YAGNI | `risk-and-yagni.md` | cpo | R1~R7 리스크 + 완화책 + OUT-OF-SCOPE 명시 (확장 범위로 일부 IN 이동) | (없음 — CPO 직접) |
| **기술 구현 계획** | `tech-implementation-plan.md` | cto | Plan-Plus 의도/대안/YAGNI + 작업 분해 + sprint별 책임 + Tech 스택 | (없음 — CTO 직접) |
| **NFR + Data Model** | `nfr-and-data-model.md` | cto | G-1 비기능요구사항(성능/보안/확장성) + G-2 catalog.json 인덱스 빌더 | (없음 — CTO 직접) |
| **Impact + 일정** | `cto-impact-schedule.md` | cto | Changed Resources + Consumers + 14 sprint 작업 분해 (technical) | (없음 — CTO 직접) |

## Scratchpads (v0.57+)

| Agent | 경로 | 크기 | 갱신 |
|-------|------|:----:|-----|
| (없음 — CPO 직접 작성, sub-agent 위임 안 함) | — | — | — |

---

## Next

CP-1 사용자 응답 후:
- B. 표준 범위 선택 시: `/vais cpo design subagent-architecture-rethink` (또는 sub-agent 위임으로 product-discoverer/strategist/researcher 병렬)
- 최종 핸드오프: PRD(`docs/subagent-architecture-rethink/03-do/main.md`) 작성 후 → `/vais cto plan subagent-architecture-rethink`

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — CPO plan, ideation 합의 12개 결정 PRD 입력으로 승계 |
| v1.1 | 2026-04-25 | CPO 재진입: CP-1에서 사용자가 **C. 확장 범위** 채택 → D-8 결정 추가 + extended-scope.md topic 추가 + SC-08~10 + R1 리스크 IN 이동 |
| v1.2 | 2026-04-25 | CTO 진입: `## [CTO] 기술 스케치` H2 섹션 append + D-T1~D-T5 결정 추가 + 3 topic (tech-implementation-plan / nfr-and-data-model / cto-impact-schedule) 추가. G-1/G-2/G-4 보완 |
