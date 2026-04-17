# docs-structure-redesign - 기획서

> ⛔ **Plan 단계 범위**: 이 문서는 분석과 결정만 기록합니다. 실제 코드 수정(`lib/`, `agents/`, `skills/`, `tests/` 등)은 Do 단계에서 수행합니다.
>
> 🌀 **Dogfooding**: 이 문서가 `docs/docs-structure-redesign/01-plan/main.md` 경로에 저장되는 것 자체가 피처 중심 구조(`docs/{feature}/{phase}/main.md`)의 첫 산출물입니다.

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | v0.52.0 커밋(9a314ab)에서 `docs/` 구조를 피처 중심으로 전환했으나, **29개 파일에 레거시 경로(`docs/\d\d-`) 패턴이 잔존**하여 설정(`vais.config.json`)과 코드(`lib/paths.js ideationPath()` 등) 간 불일치 발생 |
| **Solution** | 잔존 레거시 참조를 4개 그룹(runtime / agents / docs / tests)으로 분류하여 일괄 마이그레이션하고, `tests/paths.test.js`의 혼재 상태를 새 구조 기준으로 재정렬 |
| **Function/UX Effect** | 워크플로우 실행 시 모든 C-Level 에이전트 산출물이 일관되게 `docs/{feature}/{phase}/main.md`에 생성됨 → 피처 수명주기 단일 뷰 확립 |
| **Core Value** | 구조 전환의 **정합성 완결** — 부분 구현 상태에서 오는 회귀 리스크 제거, dogfooding을 통한 신뢰 확보 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 설정/코드 이중 경로로 인해 ideation/워크플로우 실행 시 실제 산출물 경로가 config와 달라지는 버그 잠재 |
| **WHO** | VAIS Code 플러그인 유지보수자, 워크플로우 사용자 (모든 /vais 명령 수행자) |
| **RISK** | 실행 에이전트(infra-architect, backend-engineer 등) 경로 변경이 기존 워크플로우 회귀 유발 가능성 |
| **SUCCESS** | `rg 'docs/\d\d-' --glob '!docs/_legacy/**' --glob '!CHANGELOG.md'` = **0줄** |
| **SCOPE** | **코드·문서 경로 문자열 치환**만 수행. `docs/_legacy/` 실제 파일 이동이나 신규 기능 추가는 범위 밖. |

---

## 0. 아이디어 개요

### 아이디어 한 줄 설명
> v0.52.0에서 시작된 "phase 중심 → 피처 중심 docs 구조" 전환의 **잔여 정합성 작업을 완결**한다.

### 배경 (왜 필요한지)
- 현재 문제: `vais.config.json.docPaths`는 피처 중심(`docs/{feature}/{phase}/main.md`)이지만, `lib/paths.js`의 `ideationPath()`, 실행 에이전트 11개, skill 2개, lib 8개 등 **29개 파일**이 여전히 레거시 경로(`docs/00-ideation/`, `docs/01-plan/` 등)를 가리킨다.
- 기존 해결책의 한계: 커밋 9a314ab가 "139개 경로 치환"을 표방했으나 grep 검증 결과 29개 파일이 누락됨 — 전수 치환 검증 프로세스 부재.
- 이 아이디어가 필요한 이유: 실행 에이전트의 경로 참조가 config와 다르면, `/vais cto do {feature}` 실행 시 산출물이 새 구조가 아닌 옛 경로에 생성될 가능성이 있다(현재 config 우선 원칙이 적용되지만, 에이전트 문서 기반 지시는 LLM 파싱에 의존하므로 휴먼 에러 유발).

### 타겟 사용자
- 주요 사용자: VAIS Code 플러그인 개발자(유지보수)
- 보조 사용자: VAIS 워크플로우 사용자(일관된 산출물 경로 기대)
- 현재 Pain Point: 커밋 로그는 "완료"로 표시되나 실제 코드는 혼재 상태 → 신뢰도 저하

### 사용자 시나리오
> VAIS 플러그인 사용자가 새 피처 `foo-bar`로 워크플로우를 시작하는 상황.

1. 상황: `/vais cto plan foo-bar` 실행
2. 행동: CTO가 `infra-architect` 등 실행 에이전트에 위임
3. 결과(현재): 에이전트 문서 지시(`docs/01-plan/cto_foo-bar.plan.md`)와 config(`docs/foo-bar/01-plan/main.md`)가 충돌해 어느 쪽에 생성되는지 예측 불가
4. 결과(목표): 모든 참조가 일관되어 `docs/foo-bar/01-plan/main.md` 하나에 결정적으로 생성됨

## 0.5 MVP 범위

### 핵심 작업 브레인스토밍 (중요도/난이도 매트릭스)

| 작업 | 중요도 | 난이도 | MVP 포함 |
|------|--------|--------|---------|
| `lib/paths.js` `ideationPath()` 피처 중심 재작성 | 5 | 2 | **Y** |
| `lib/paths.js` 주석(line 227) 갱신 | 2 | 1 | Y |
| lib/ 8개 파일 레거시 경로 문자열 치환 | 5 | 2 | **Y** |
| agents/ 11개 실행 에이전트 경로 치환 | 5 | 3 | **Y** |
| skills/ 2개(ideation.md, init.md) 경로 치환 | 5 | 2 | **Y** |
| scripts/ 2개, tests/ 1개 레거시 참조 치환 | 3 | 2 | Y |
| README.md, vendor/README.md 갱신 | 2 | 1 | Y |
| `tests/paths.test.js` 옛 구조 테스트 리라이트 | 4 | 2 | **Y** |
| `docs/_legacy/` 실제 파일을 새 구조로 역마이그레이션 | 2 | 4 | N (별도 피처) |
| phase당 sub-doc 분리 지원 기능 확장 | 2 | 4 | N (별도 피처) |

### MVP 포함 작업 (8개)
1. `lib/paths.js` `ideationPath()` 재작성 + 주석 갱신
2. lib/ 나머지 7개 파일 경로 치환 (doc-validator, migration-engine, state-machine-v050, agent-registry, cp-guard, advisor/*, control/cost-monitor)
3. agents/cto/ 7개 실행 에이전트 문서 갱신
4. agents/cpo/ 3개 (prd-writer, product-researcher, product-strategist)
5. agents/coo/performance-engineer, agents/_shared/ideation-guard
6. skills/vais/phases/ideation.md + skills/vais/utils/init.md
7. scripts/ 2개 + tests/scenario-verification.test.js + README.md + vendor/README.md
8. `tests/paths.test.js` line 94~109 새 구조로 리라이트 + 회귀 테스트 추가

### 이후 버전으로 미룰 작업
- `docs/_legacy/` 내 실제 옛 산출물을 `docs/{feature}/` 구조로 역마이그레이션 (별도 피처 `legacy-docs-migration`)
- phase당 sub-doc 분할 기능 고도화

## 0.6 경쟁/참고 분석

해당 없음 (내부 구조 정리 작업).

## 0.7 PRD 입력 (CTO 전용)

| Key | Value |
|-----|-------|
| PRD 경로 | 없음 (강행 모드 — 내부 기술부채 처리) |
| 완성도 | missing |
| 검사 시각 | 2026-04-17 |

### 강행 모드 사유

- 사용자 선택: CEO ideation에서 내부 기술부채 성격의 피처로 확인됨 (S-10 시나리오)
- 가정한 요구사항:
  1. 기능 변경 없이 경로 문자열만 치환한다 (동작 불변)
  2. 레거시 경로 참조는 100% 제거 (`_legacy/`, `CHANGELOG.md` 제외)
  3. 기존 테스트 100% 통과 + 회귀 테스트 추가

## 1. 개요

### 1.1 기능 설명
잔존 29개 파일의 레거시 경로 문자열을 피처 중심 구조(`docs/{feature}/{phase}/main.md`)로 일괄 치환하고, 테스트 정합성을 회복한다.

### 1.2 목적
- 해결하려는 문제: config-code 경로 불일치로 인한 실행 불확실성
- 기대 효과: 모든 /vais 워크플로우가 일관된 경로로 산출물 생성
- 대상 사용자: 플러그인 유지보수자 + 모든 워크플로우 사용자

## 2. Plan-Plus 검증

### 2.1 의도 발견
근본 문제는 "경로 문자열"이 아니라 **"구조 전환의 부분 완료 상태 방치"**. 경로 치환은 증상 치료이며, 근본적으로는 **전수 치환 검증 프로세스**(CI grep guard 등)가 있어야 재발 방지된다.

### 2.2 대안 탐색

| # | 대안 | 장점 | 단점 | 채택 여부 |
|---|------|------|------|----------|
| 1 | **일괄 치환 (Do 1회)** | 단순, 빠름, PR 단위 명확 | 대량 diff로 리뷰 부담 | ✅ 채택 |
| 2 | 그룹별 분할 PR (lib → agents → skills → tests) | 리뷰 용이, 회귀 격리 | 작업 4회 분할, 중간 상태 혼재 기간 길어짐 | ❌ 기각 — 혼재 기간이 오히려 위험 |
| 3 | 호환 레이어 (legacy path → new path 리다이렉트) | 점진 전환 가능 | 복잡도 증가, 영구 부채 | ❌ 기각 — YAGNI |
| 4 | 코드 생성기로 자동 치환 | 휴먼 에러 최소화 | 도구 도입 비용, 검증 별도 필요 | ❌ 기각 — 규모가 크지 않음 (29개) |

**채택: 대안 1 (일괄 치환)**. 규모가 작고 변경이 기계적이어서 리뷰 부담보다 혼재 기간 제거 가치가 큼.

### 2.3 YAGNI 리뷰
- [x] 현재 필요한 기능만 포함했는가? → Y (기능 추가 없음, 순수 치환)
- [x] 미래 요구사항을 위한 과잉 설계가 없는가? → Y (호환 레이어 기각)
- [x] 제거할 수 있는 기능이 있는가? → 고려: `lib/paths.js ideationPath()` 자체 삭제 검토. 외부 호출자가 없으면 삭제, 있으면 재작성.
- 제거 후보: `ideationPath()` (Do 단계에서 사용처 grep 후 결정)

## 3. 사용자 스토리

| # | As a... | I want to... | So that... |
|---|---------|-------------|------------|
| 1 | 플러그인 유지보수자 | 모든 경로 참조가 일관되게 피처 중심 구조를 가리키기를 | 코드와 설정 불일치로 인한 디버깅 시간을 줄이고 싶다 |
| 2 | 워크플로우 사용자 | `/vais cto do foo` 실행 시 산출물이 결정적으로 `docs/foo/03-do/main.md`에 생성되기를 | 피처 단위로 산출물을 추적하고 싶다 |
| 3 | 신규 기여자 | 테스트가 현재 구조와 일치하기를 | 코드 변경 시 올바른 회귀 신호를 받고 싶다 |

## 4. 기능 요구사항

### 4.1 작업 목록

| # | 작업 | 대상 파일 | 치환 패턴 | 우선순위 | 구현 상태 |
|---|------|-----------|----------|---------|----------|
| 1 | `ideationPath()` 재작성 | `lib/paths.js:240-244` | `docs/00-ideation/{role}_{topic}.md` → `docs/{topic}/ideation/main.md` | Must | 미구현 |
| 2 | 주석 레퍼런스 갱신 | `lib/paths.js:227` | `docs/01-plan/features/v050/...` → `docs/_legacy/...` 또는 삭제 | Must | 미구현 |
| 3 | lib/ 경로 문자열 치환 | 7개 (doc-validator, migration-engine, state-machine-v050, agent-registry, cp-guard, advisor/*, control/cost-monitor) | 개별 검토 후 `docs/{feature}/{phase}/main.md`로 통일 | Must | 미구현 |
| 4 | agents/cto/ 실행 에이전트 갱신 | 7개 (infra-architect, backend-engineer, frontend-engineer, test-engineer, ui-designer, db-architect, incident-responder) | `docs/02-design/{role}_{feature}.design.md` → `docs/{feature}/02-design/main.md` 등 | Must | 미구현 |
| 5 | agents/cpo/ 갱신 | prd-writer, product-researcher, product-strategist | 동일 | Must | 미구현 |
| 6 | agents/coo/, _shared/ 갱신 | performance-engineer, ideation-guard | 동일 | Must | 미구현 |
| 7 | skills/ 갱신 | vais/phases/ideation.md, vais/utils/init.md | 동일 | Must | 미구현 |
| 8 | scripts/, tests/ 갱신 | check-cc-advisor-support.js, refactor-audit.js, scenario-verification.test.js | 동일 | Must | 미구현 |
| 9 | README.md, vendor/README.md 갱신 | 2개 | 문서 참조 갱신 | Should | 미구현 |
| 10 | `tests/paths.test.js` 리라이트 | `tests/paths.test.js:94-109` | 옛 구조 `docs/01-plan/cto_테스트.plan.md` 케이스 → 새 구조 (**현재 2건 fail 상태**, CSO Finding #2 참조) | Must | 미구현 |
| 11 | 회귀 테스트 추가 | 동 | "레거시 경로 생성 금지" 단위 테스트 | Nice | 미구현 |
| 12 | **`lib/quality/template-validator.js` 치환 (신규)** | `lib/quality/template-validator.js:78-82` | `'01-plan/'` → `'/plan/'` 등 **런타임 phase 추출 로직**. CSO Finding #1로 추가 | Must | 미구현 |

> ⚠️ **대상 파일 수 정정**: CSO Design Review Finding #1로 `lib/quality/template-validator.js` 1건 추가 발견 → **총 29개 → 30개**. §Impact Analysis 참조.

### 4.2 작업 상세

#### F1. `ideationPath()` 재작성
- **트리거**: ideation phase 진입 시 CEO가 호출
- **정상 흐름**: `ideationPath('ceo', 'foo-bar')` → `docs/foo-bar/ideation/main.md` 반환
- **예외 흐름**: `validateComponent` 실패 시 기존 에러 유지
- **산출물**: 수정된 `lib/paths.js`

#### F2. 에이전트 경로 지시 치환
- **트리거**: C-Level 에이전트가 sub-agent 위임 시
- **정상 흐름**: 에이전트 문서의 경로 문구를 `docs/{feature}/{phase}/main.md` 형식으로 통일
- **예외 흐름**: 다중 산출물을 가진 에이전트(예: `infra-architect`)는 `docs/{feature}/02-design/infra.md` 같은 sub-doc 규칙 채택(§5.1 참조)
- **산출물**: 수정된 agents/, skills/, scripts/ 등 28개 파일

## 5. 정책 정의

### 5.1 경로 규칙 정책

| # | 정책 | 규칙 | 비고 |
|---|------|------|------|
| 1 | 기본 경로 | `docs/{feature}/{phase}/main.md` | config와 일치 |
| 2 | phase당 sub-doc | `docs/{feature}/{phase}/{sub}.md` (main.md가 인덱스 역할) | 대형 피처 한정 |
| 3 | 레거시 참조 허용 | `docs/_legacy/`, `CHANGELOG.md` 내부에만 허용 | grep guard 예외 |
| 4 | 에이전트 role 지시 | 경로에 `{role}_` prefix 붙이지 않음 | v0.52 이전 규칙 폐기 |

### 5.2 치환 지침 (Do 단계에서 적용)

| 레거시 패턴 | 새 패턴 |
|-------------|---------|
| `docs/00-ideation/{role}_{feature}.md` | `docs/{feature}/00-ideation/main.md` |
| `docs/01-plan/{role}_{feature}.plan.md` | `docs/{feature}/01-plan/main.md` |
| `docs/02-design/{role}_{feature}.design.md` | `docs/{feature}/02-design/main.md` |
| `docs/02-design/infra-architect_{feature}.design.md` | `docs/{feature}/02-design/infra.md` (sub-doc) |
| `docs/03-do/{role}_{feature}.do.md` | `docs/{feature}/03-do/main.md` |
| `docs/04-qa/{role}_{feature}.qa.md` | `docs/{feature}/04-qa/main.md` |
| `docs/05-report/{role}_{feature}.report.md` | `docs/{feature}/05-report/main.md` |

### 5.3 유효성 검증 규칙

| 항목 | 검증 방법 |
|------|----------|
| 전수 치환 | `rg 'docs/\d\d-' --glob '!docs/_legacy/**' --glob '!CHANGELOG.md'` → 0줄 |
| 플러그인 구조 무결성 | `node scripts/vais-validate-plugin.js` 통과 |
| 단위 테스트 | `node --test tests/paths.test.js` 통과 |
| 전체 테스트 | `node --test tests/` 통과 |

## 6. 비기능 요구사항

| 항목 | 요구사항 | 기준 |
|------|---------|------|
| 성능 | 변경 없음 (문자열 치환만) | `ideationPath()` 호출 시간 기존 ±5% 이내 |
| 보안 | 변경 없음 | `safePath` 경로 탈출 방지 로직 유지 |
| 호환성 | 기존 워크플로우 회귀 없음 | 모든 단위 테스트 통과 |
| 유지보수성 | 재발 방지 | CI grep guard 추가 검토 (Do 단계에서 판단) |

## Success Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01 | 레거시 경로 전수 제거 | `rg 'docs/\d\d-' --glob '!docs/_legacy/**' --glob '!CHANGELOG.md'` = 0줄 |
| SC-02 | `lib/paths.js ideationPath()`가 피처 중심 경로 반환 | 신규 단위 테스트 통과 |
| SC-03 | **paths.test.js 리라이트 후** `tests/` 전체 100% 통과 | `node --test tests/` exit 0 (현재 baseline은 `paths.test.js`에 2건 fail 중 — CSO Finding #2 참조. 리라이트로 해소) |
| SC-04 | `tests/paths.test.js` 내 레거시 구조 검증 케이스 제거 | 해당 파일 `docs/\d\d-` 패턴 0회 |
| SC-05 | 플러그인 구조 무결성 유지 | `node scripts/vais-validate-plugin.js` exit 0 |
| SC-06 | dogfooding 완수 | `docs/docs-structure-redesign/01-plan/main.md` 존재 (본 문서) + do/qa/report도 동일 구조로 생성 |

> QA 단계에서 각 기준을 ✅ Met / ⚠️ Partial / ❌ Not Met 으로 평가합니다.

## Impact Analysis

### Changed Resources

| Resource | Type | Change Description |
|----------|------|-------------------|
| `lib/paths.js` | modify | `ideationPath()` 재작성, line 227 주석 갱신 |
| `lib/doc-validator.js`, `migration-engine.js`, `state-machine-v050.js`, `agent-registry.js`, `cp-guard.js`, `advisor/prompt-builder.js`, `advisor/wrapper.js`, `control/cost-monitor.js`, **`quality/template-validator.js`** | modify | 레거시 경로 문자열 치환 (template-validator는 **런타임 phase 추출 로직** — CSO Finding #1로 추가) |
| `agents/cto/*.md` (7개) | modify | 경로 지시 갱신 |
| `agents/cpo/prd-writer.md`, `product-researcher.md`, `product-strategist.md` | modify | 경로 지시 갱신 |
| `agents/coo/performance-engineer.md`, `agents/_shared/ideation-guard.md` | modify | 경로 지시 갱신 |
| `skills/vais/phases/ideation.md`, `skills/vais/utils/init.md` | modify | 경로 지시 갱신 |
| `scripts/check-cc-advisor-support.js`, `refactor-audit.js` | modify | 레거시 경로 참조 제거 |
| `tests/scenario-verification.test.js` | modify | 레거시 경로 참조 제거 |
| `tests/paths.test.js:94-109` | modify | 옛 구조 테스트 → 새 구조 리라이트 |
| `README.md` (line 238, **277-282 구조 설명 블록 6줄 rewrite**), `vendor/README.md`, **`CLAUDE.md:29`** | modify | 문서 경로 참조 갱신 — CSO Finding #3로 범위 구체화 |
| `docs/docs-structure-redesign/01-plan/main.md` | create | 본 문서 (Plan 산출물) |

### Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| `ideationPath()` | call | (Do 단계에서 grep 필요) | 호출자 있으면 반환 경로 변경 → 이관 필요 |
| agents/*.md 경로 지시 | LLM 파싱 | 모든 /vais {c-level} {phase} 실행 | 경로 일관성 회복 |
| `tests/paths.test.js` | run | CI/로컬 테스트 | 혼재 제거로 명확한 신호 |

### Verification
- [x] 모든 consumer 확인 완료 (29개 grep 결과 기반)
- [ ] breaking change 없음 확인 → **Do 단계에서 `ideationPath()` 호출자 grep 후 판정**

## 7. 기술 스택

N/A — 코드 마이그레이션 작업(새 기술 도입 없음).

### 7.1 UI 컴포넌트 라이브러리

N/A — UI 변경 없음.

## 8. 화면 목록 (예상)

N/A — 내부 구조 작업.

## 데이터 모델 개요

N/A — 데이터 모델 변경 없음.

## API 엔드포인트 개요

N/A — API 변경 없음.

## 9. 일정 (예상)

| 단계 | 산출물 |
|------|--------|
| 기획 | 본 문서 (`docs/docs-structure-redesign/01-plan/main.md`) ✅ |
| 설계 | `docs/docs-structure-redesign/02-design/main.md` — 치환 스크립트 설계 + 에이전트 문서 rewrite 전략 |
| 구현 (Do) | `docs/docs-structure-redesign/03-do/main.md` + 실제 코드 변경 29개 파일 |
| QA | `docs/docs-structure-redesign/04-qa/main.md` — SC-01~06 검증 |
| 보고 | `docs/docs-structure-redesign/05-report/main.md` — 재발 방지 CI guard 제안 포함 |

> 다음 단계: `/vais cto design docs-structure-redesign`

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-17 | 초기 작성 — CEO ideation 검증 결과 기반 plan 작성 (잔존 29개 파일 마이그레이션 계획 + dogfooding) |
| v1.1 | 2026-04-17 | CSO Design Review 반영 — §4.1에 #12 `template-validator.js` 추가(총 30개), SC-03 문구 개정(baseline 2 fail 명시), §Impact Analysis lib 목록 확장, README/CLAUDE.md 치환 범위 라인 단위 명시 |

<!-- template version: v0.18.0 -->
