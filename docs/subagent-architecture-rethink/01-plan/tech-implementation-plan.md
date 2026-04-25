---
owner: cto
topic: tech-implementation-plan
phase: plan
feature: subagent-architecture-rethink
---

# Topic: 기술 구현 계획 (CTO Plan)

> CPO PRD `03-do/main.md` v1.1 + qa `cto-handoff.md`를 입력으로 받아 기술 구현 계획 수립.

## 1. PRD 입력 검증

| Key | Value |
|-----|-------|
| PRD 경로 | `docs/subagent-architecture-rethink/03-do/main.md` |
| 완성도 | full (designCompleteness 100%, 8/8 섹션) |
| 검사 시각 | 2026-04-25 |
| 강행 모드 | 아님 (PRD 존재) |

### PRD 핵심 결정 (CTO가 따라야 할 항목)

| # | 결정 | PRD 출처 |
|:-:|------|----------|
| 1 | 4단계 메타-프레임 (Core/Why/What/How) sub-agent 분류 | 섹션 3, 7 |
| 2 | "산출물이 sub-agent 정의" 메타-원칙 | F2 |
| 3 | Project Profile schema v1 (12 변수) + ideation 종료 hook | F1 |
| 4 | 정책 4분류 (A/B/C/D) | F2 |
| 5 | Template depth (c) — sample+checklist+anti-pattern | F3 |
| 6 | release-engineer 5분해 + 의심 5 정책 적용 | F4+F5 |
| 7 | CEO 4 + CPO/What 1 신규 sub-agent | F6 |
| 8 | Alignment α + β | F7 |
| 9 | VPC → product-strategist 재매핑 | F8 |
| 10 | 25 우선 → 50+ 점진 카탈로그 | F3 |

## 2. Plan-Plus 검증

### 2.1 의도 발견

> "AI agent가 호출되면 무조건 자기 임무를 수행하는 default-execute 패턴"이 sub-agent 일반의 시스템 차원 anti-pattern. release-engineer는 가장 가시적 사례일 뿐 — 6 sub-agent에 동일 패턴 확인. 본 피처는 release-engineer만 고치는 게 아니라 **VAIS sub-agent 행동 모델 자체**를 변경.

### 2.2 대안 탐색

| # | 대안 | 장점 | 단점 | 채택 |
|:-:|------|------|------|:----:|
| 1 | sub-agent prompt에 "필요한지 먼저 물어라" 명령 추가 | 단순 | prompt 의존 — 일관성 보장 X | ❌ |
| 2 | 시스템 레벨 게이트 (호출 전 사용자 confirmation) | 강제력 | 매번 묻기 옵션 피로 (R5 → 영구 거부) | ❌ |
| 3 | **Project Profile + 산출물 메타데이터 정책 (채택)** | Profile 1회 합의 + 자동 게이트 + 검증 가능 + 카탈로그 표준화 동시 | 작업량 큼 (R1) | ✅ |
| 4 | sub-agent 갯수 감축 (44→20) | 단순화 | 산출물 누락 위험 + 분류 척도 부재 시 자의적 | ❌ |
| 5 | 외부 reference 그대로 복제 | 빠름 | 회사별 편향 + VAIS 맥락 어긋남 | ❌ |

→ 대안 3 채택 (ideation D-2 + plan D-7 + design D-D2 누적 검증).

### 2.3 YAGNI 리뷰

| 영역 | 검토 | 결론 |
|------|------|------|
| H2 도입 항목 (epistemic contract / uncertainty reporting / absorb 대화 강제) | 매력적이지만 H2 — 본 phase 작업 X | OUT |
| 50+ 카탈로그 일괄 작성 | 25 우선 + 잔여 누적이 검증 충분 | 25 → 50 점진 |
| 모든 44 sub-agent 재정의 | release-engineer 5분해 + 의심 5 정책만 critical | 점진 적용 |
| CEL 파서 도입 (scope_conditions) | 단순 dict 비교로 시작 충분 | OUT |
| TypeScript 도입 | 기존 CJS 패턴 유지 | OUT |
| GraphQL/REST API | N/A — 플러그인 | OUT |

## 3. 기술 스택 (D-T5)

| 영역 | 기술 | 이유 |
|------|------|------|
| Runtime | Node.js (CJS) | 기존 lib/* 패턴. ESM 전환 OOS |
| YAML 파싱 | `js-yaml` | Profile schema 파싱 표준 |
| Frontmatter 파싱 | `gray-matter` | template metadata 표준 |
| Testing | Jest | 기존 |
| Validation | 자체 `template-validator.js` | 신규 (CEL 파서 불필요) |
| 의존성 신규 | `js-yaml`, `gray-matter` 2개만 | 최소화 |

## 4. 작업 분해 (Sprint 1~14)

CPO `release-roadmap.md` 승계 + CTO 기술 책임자 명시:

### Sprint 1~3 — F1 Profile + F2 Template metadata (Quick win F2)

| 작업 | 파일 | 책임 sub-agent | LOC 예상 |
|------|------|--------------|:--:|
| Profile schema 정의 + 유효성 검증 | `lib/project-profile.js` (신규) | infra-architect | ~250 |
| ideation-guard hook 수정 — Profile 합의 prompt + yaml 저장 | `hooks/ideation-guard.js` (수정) | infra-architect | ~120 |
| Template metadata schema 정의 + validator | `scripts/template-validator.js` (신규) | backend-engineer | ~200 |
| Profile context load — 모든 C-Level 진입 시 자동 주입 | `lib/c-level-context.js` (신규) 또는 기존 lib 수정 | infra-architect | ~100 |
| EXP-1 검증 테스트 | `tests/integration/profile-gate.test.js` (신규) | test-engineer | ~80 |
| **G-1 NFR 보안**: profile.yaml secret 차단 + path traversal | `lib/project-profile.js` 내장 | infra-architect | (포함) |

### Sprint 4~6 — F3 Core+Why 10 template + F8 VPC 재매핑

| 작업 | 파일 | 책임 |
|------|------|-----|
| Core 5 template (Vision/Strategy Kernel/OKR/PR-FAQ/3-Horizon) | `templates/core/*.md` × 5 | ui-designer + 도메인 sub-agent |
| Why 5 template (PEST/Five Forces/SWOT/JTBD/Persona) | `templates/why/*.md` × 5 | ui-designer + market-researcher |
| VPC 재매핑 — 3 파일 변경 | `templates/why/value-proposition-canvas.md` (신규/이동) + `agents/cbo/copy-writer.md` (수정) + `agents/cpo/product-strategist.md` (수정) | infra-architect |
| EXP-2 검증 (depth c 품질) | `tests/integration/template-quality.test.js` | test-engineer |

### Sprint 7~10 — F4 44 점검 + F5 release 5분해 + F6 신규 sub-agent 5

| 작업 | 파일 | 책임 |
|------|------|-----|
| release-engineer 5분해 — 5개 신규 agent md + deprecate notice | `agents/coo/release-{notes-writer,configurator,container,migration-planner,runbook-author}.md` (신규) + `release-engineer.md` (수정) | infra-architect |
| CEO 4 신설 — vision/strategy-kernel/okr/pr-faq-author | `agents/ceo/*.md` × 4 (신규) | infra-architect |
| roadmap-author 신설 | `agents/cpo/roadmap-author.md` (신규) | infra-architect |
| **D-T3 G-4**: vais.config.json `cSuite` 업데이트 + package.json `claude-plugin > agents` 업데이트 | `vais.config.json` + `package.json` (수정) | infra-architect |
| 44 audit 매트릭스 작성 — Q-A/B/C/D 4기준 | `04-qa/subagent-audit-matrix.md` (신규) | qa-engineer + 도메인 sub-agent |
| EXP-3 검증 (44 매트릭스 점검) | 매트릭스 자체가 검증 | — |

### Sprint 11~14 — F3 잔여 25 + F7 Alignment α+β + 외부 인터뷰

| 작업 | 파일 | 책임 |
|------|------|-----|
| What 7 + How 11 + 사업·재무 5 = 23 추가 template | `templates/{what,how,biz}/*.md` × 23+ | ui-designer + 도메인 sub-agent |
| auto-judge alignment α 메트릭 | `lib/auto-judge.js` (수정) | backend-engineer |
| Alignment 산출물 template 3개 | `templates/alignment/{core-why,why-what,what-how}.md` × 3 | ui-designer |
| 외부 인터뷰 5~7명 | `docs/subagent-architecture-rethink/02-design/user-interviews.md` (신규) | ux-researcher (CPO 위임) |
| EXP-4 (alignment α 70% 감지) + EXP-5 (인터뷰 통증 보편성) | 측정 | — |

## 5. release-engineer 5분해 정책 (D-T4 강조)

**critical**: release-engineer만 5분해. 다른 6개 anti-pattern sub-agent (infra/test/seo/finops/compliance + copy-writer)는 **in-place 수정** (분해 X) — 정책 추가만.

```yaml
# agents/coo/release-engineer.md (deprecate alias)
---
deprecated: true
deprecation_notice: "v0.59에서 5분해됨. release-notes-writer / ci-cd-configurator / container-config-author / migration-planner / runbook-author로 이동. 1 phase 후 제거 예정."
removal_target: v0.60
---
```

다른 6개는 정책 적용 (`agents/cto/infra-architect.md` 등 frontmatter `execution.policy.scope_conditions` 추가).

## 6. 위험 완화 (R1 ~ R7 + RA Top 3)

CPO `risk-and-yagni.md`의 R1~R7 + design `key-design-decisions.md`의 Top 3 RA 그대로 승계. CTO 추가 완화책:

| ID | 추가 완화 |
|----|---------|
| R1 (작업량 폭증) | Sprint 1~3 완료 후 5개 파일럿 측정 → 잔여 11 sprint 일정 재추정. partial 허용 |
| R4 (파괴적) | release-engineer만 deprecate alias, 나머지 6개 in-place — 기존 호출 파괴 X |
| R6 (작동 중단) | feature flag `vais.config.json > orchestration.profileGateEnabled: bool` — 신규 게이트 점진 활성화 |

## 7. CTO 큐레이션 기록

| Source | 채택 | 거절 | 병합 | 추가 | 이유 |
|----|:----:|:----:|:----:|:----:|------|
| PRD F1~F8 | ✅ | | | | 그대로 |
| qa Gap G-1 (NFR) | | | | ✅ | D-T1 추가 — `nfr-and-data-model.md` |
| qa Gap G-2 (data model) | | | | ✅ | D-T2 추가 — catalog.json 인덱스 |
| qa Gap G-4 (cSuite) | | | | ✅ | D-T3 추가 — Sprint 7 작업 |
| qa Gap G-3 (API N/A) | | | | | PRD v1.1에서 해소됨 |
| **추가 결정** | | | | ✅ | D-T4 (분해 정책 — release만 5분해) |
| **추가 결정** | | | | ✅ | D-T5 (CEL 파서 OUT — YAGNI) |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — CTO Plan, Plan-Plus + 작업 분해 + Tech 스택 + D-T1~D-T5 |
