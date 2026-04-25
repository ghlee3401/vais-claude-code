---
owner: cto
topic: cto-impact-schedule
phase: plan
feature: subagent-architecture-rethink
---

# Topic: Impact Analysis + 일정 (CTO Plan)

## 1. Impact Analysis

### 1.1 Changed Resources (변경 대상)

| Resource | Type | 변경 설명 | Sprint |
|----------|------|---------|:------:|
| `lib/project-profile.js` | **create** | Profile schema 로드/유효성/scope_conditions 평가/Context Load 주입 | 1~3 |
| `lib/c-level-context.js` | **create** | 모든 C-Level 진입 시 Profile 자동 주입 (또는 lib/io.js 확장) | 1~3 |
| `lib/auto-judge.js` | **modify** | alignment α 메트릭 (키워드 일치율 + 산출물 차이 감지) 추가 | 11~14 |
| `hooks/ideation-guard.js` | **modify** | ideation 종료 시 Profile 합의 prompt + project-profile.yaml 저장 | 1~3 |
| `scripts/template-validator.js` | **create** | frontmatter schema 검증 + 정책 매핑 + (c) 깊이 검증 (3섹션) | 4~6 |
| `scripts/build-catalog.js` | **create** | templates/*.md scan → catalog.json 인덱스 빌드 | 4~6 |
| `agents/coo/release-engineer.md` | **modify** | deprecate notice + alias notice | 7~10 |
| `agents/coo/release-notes-writer.md` | **create** | 신규 (Always 정책) | 7~10 |
| `agents/coo/ci-cd-configurator.md` | **create** | 신규 (Scope 정책) | 7~10 |
| `agents/coo/container-config-author.md` | **create** | 신규 (Scope 정책) | 7~10 |
| `agents/coo/migration-planner.md` | **create** | 신규 (Triggered 정책) | 7~10 |
| `agents/coo/runbook-author.md` | **create** | 신규 (Scope 정책) | 7~10 |
| `agents/ceo/vision-author.md` | **create** | 신규 (Always) | 7~10 |
| `agents/ceo/strategy-kernel-author.md` | **create** | 신규 (Always) | 7~10 |
| `agents/ceo/okr-author.md` | **create** | 신규 (Always) | 7~10 |
| `agents/ceo/pr-faq-author.md` | **create** | 신규 (User-select) | 7~10 |
| `agents/cpo/roadmap-author.md` | **create** | 신규 (Always) | 7~10 |
| `agents/cbo/copy-writer.md` | **modify** | VPC 책임 제거 (D-D7 / F8) | 4~6 |
| `agents/cpo/product-strategist.md` | **modify** | VPC 책임 추가 | 4~6 |
| `agents/cto/infra-architect.md` | **modify** | execution.policy.scope_conditions 추가 (default-execute 해소) | 7~10 |
| `agents/cto/test-engineer.md` | **modify** | unit=A / integration=B / e2e=B 정책 적용 | 7~10 |
| `agents/cbo/seo-analyst.md` | **modify** | brand.seo_dependent=true 조건 | 7~10 |
| `agents/cbo/finops-analyst.md` | **modify** | deployment.target IN [cloud,hybrid] 조건 | 7~10 |
| `agents/cso/compliance-auditor.md` | **modify** | handles_pii=true 조건 + DPIA 분리 검토 | 7~10 |
| `templates/{core,why,what,how,biz}/*.md` | **create** | 25개 우선 (depth c) → 50개 잔여 | 4~14 |
| `templates/alignment/{core-why,why-what,what-how}.md` | **create** | alignment β 산출물 template 3개 | 11~14 |
| `vais.config.json` | **modify** | `cSuite.{c-level}.subAgents` 배열 + `orchestration.profileGateEnabled` 신규 | 7~10 |
| `package.json` | **modify** | `claude-plugin > agents` 배열 (신규 agent 7~10개) + `dependencies` (js-yaml, gray-matter) | 1~3, 7~10 |
| `tests/integration/*.test.js` | **create** | profile-gate / template-quality / catalog-build / policy-evaluation 신규 ~5 파일 | 1~14 |
| `tests/perf/profile-gate.bench.js` | **create** | NFR latency 측정 | 1~3 |
| `04-qa/subagent-audit-matrix.md` | **create** | 44행 audit 매트릭스 | 7~10 |
| `02-design/user-interviews.md` | **create** | 외부 인터뷰 5~7명 리포트 | 11~14 |
| `CHANGELOG.md` | **modify** | BREAKING change 명시 (release-engineer deprecate / VPC 재매핑) | 14 |

**총계**: create 25+ / modify 10+ = **35+ 파일 변경**.

### 1.2 Current Consumers (영향받는 기존 코드)

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| `vais.config.json` | Read | `lib/io.js` / `lib/c-level-context.js` 등 | cSuite 변경 시 모든 호출 영향 — feature flag로 점진 적용 |
| `agents/coo/release-engineer.md` | Skill load | Claude Code agent invocation | deprecate alias로 1 phase 호환 유지 |
| `agents/cbo/copy-writer.md` | Skill load | 동일 | VPC 책임 제거 — 기존 호출이 VPC 요청 시 새 sub-agent로 redirect |
| `templates/plan.template.md` | Read | CPO/CTO 진입 | metadata schema 추가 (canon_source 등) — 기존 template 후방 호환 |
| `lib/auto-judge.js` | designCompleteness 측정 | qa phase | alignment α 메트릭 신규 추가 (기존 designCompleteness 영향 X) |
| `hooks/ideation-guard.js` | Hook trigger | ideation 종료 시 | Profile 합의 prompt 추가 — 기존 동작 유지 + 신규 단계 |

### 1.3 Verification Checklist

- [ ] 모든 consumer 확인 완료 (위 표)
- [ ] breaking change 감지 — release-engineer 5분해 / VPC 재매핑 (alias + redirect로 완화)
- [ ] feature flag 설계 — `vais.config.json > orchestration.profileGateEnabled: bool` (Sprint 1)
- [ ] CHANGELOG.md BREAKING 명시 (Sprint 14)

## 2. 일정 (Sprint 1~14)

| Sprint | 기간 | 핵심 산출물 | 완료 기준 (SC) |
|:------:|------|-----------|---------|
| **1~3** | 3주 | F1 Profile + F2 Template metadata + EXP-1 + RA-3 5 파일럿 측정 | SC-01 + SC-02 partial (기준 schema) |
| **4~6** | 3주 | F3 Core+Why 10 template + F8 VPC 재매핑 + EXP-2 | SC-04 (10/25) + SC-06 |
| **7~10** | 4주 | F4 44 매트릭스 + F5 release 5분해 + F6 신규 sub-agent 5 + cSuite 업데이트 | SC-05 + SC-09 |
| **11~14** | 4주 | F3 잔여 25+ + F7 Alignment α+β + 외부 인터뷰 + EXP-4 + EXP-5 | SC-08 partial + SC-10 |

**총 14 sprint = 약 14주 = 약 3.5개월**. R1 리스크로 sprint 1~3 완료 시점에 **5 파일럿 측정**으로 잔여 11 sprint 일정 재추정.

### 2.1 Sprint 1~3 작업 분해 (가장 critical)

| Day | 작업 |
|:---:|------|
| 1~3 | `lib/project-profile.js` 신규 — schema 로드/유효성 (G-1 보안 secret 차단) |
| 4~5 | `hooks/ideation-guard.js` 수정 — Profile 합의 prompt |
| 6~8 | `scripts/template-validator.js` 신규 — frontmatter schema 검증 |
| 9~10 | `lib/c-level-context.js` 또는 lib/io.js 확장 — Profile 자동 주입 |
| 11~12 | `tests/integration/profile-gate.test.js` 신규 (EXP-1) |
| 13~15 | `tests/perf/profile-gate.bench.js` (NFR latency) |
| 16~18 | 5개 파일럿 template (depth c) 작성 → 시간 측정 (RA-3) |
| 19~21 | `package.json` dependencies 업데이트 (js-yaml, gray-matter) + integration test |

### 2.2 Go/No-Go Gates (CTO 시점)

| Gate | 시점 | 조건 |
|------|-----|------|
| **Sprint 3 → Sprint 4** | EXP-1 + RA-3 측정 후 | Profile 게이트 latency P95 < 50ms + 5개 파일럿 평균 작성 시간 < 1.5일/template |
| **Sprint 6 → Sprint 7** | EXP-2 후 | depth (c) 25개 중 10개 완성 + template-validator 10/10 통과 |
| **Sprint 10 → Sprint 11** | F4/F5/F6 완료 후 | 44 audit 매트릭스 44/44 + release 5분해 SC-05 + cSuite 업데이트 |
| **Sprint 14 → Beta GA** | EXP-4 + EXP-5 후 | alignment α 70%+ 감지 + 외부 인터뷰 5~7명 + Profile schema 검증 리포트 |

## 3. CPO PRD release-roadmap.md와 정렬

CPO `release-roadmap.md` H1 Sprint 분할과 CTO 작업 분해 1:1 매핑 (확인됨). 차이:

| 차이 | CPO PRD | CTO Plan |
|------|---------|----------|
| Sprint 1~3 (Profile) | F1 작동 | + RA-3 5 파일럿 측정 추가 |
| Sprint 7~10 (sub-agent) | F4/F5/F6 | + vais.config.json/package.json 업데이트 명시 (G-4) |
| 전반 NFR | (G-1 미명시) | NFR 5 영역 임계값 명시 (`nfr-and-data-model.md`) |

→ CTO plan은 PRD를 기술 단위로 분해 + Gap (G-1/G-2/G-4) 보완.

## 4. 큐레이션 기록

| 항목 | 채택 |
|------|:----:|
| 35+ 파일 변경 매트릭스 | ✅ |
| 14 sprint 일정 | ✅ (CPO와 정렬) |
| 4 Go/No-Go Gates | ✅ |
| 5 파일럿 측정 (RA-3 검증) | ✅ |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-25 | 초기 작성 — Impact Analysis 35+ 파일 + Sprint 14 일정 + Go/No-Go Gates |
