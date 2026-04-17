# docs-structure-redesign - 설계

> ⛔ **Design 단계 범위**: 이 문서는 설계 결정만 기록합니다. 실제 코드 수정은 Do 단계에서 수행합니다.
> 참조 문서: `docs/docs-structure-redesign/01-plan/main.md`

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | config-code 경로 불일치 해소 — `vais.config.json.docPaths`는 피처 중심, `lib/paths.js ideationPath()` 등 29개 파일은 레거시 경로 유지 |
| **WHO** | 플러그인 유지보수자 + 모든 워크플로우 사용자 |
| **RISK** | 실행 에이전트 경로 변경이 워크플로우 회귀 유발 가능성, `docs/_legacy/` 실제 파일과 새 구조 간 포인터 혼선 |
| **SUCCESS** | `rg 'docs/\d\d-' --glob '!docs/_legacy/**' --glob '!CHANGELOG.md'` = 0줄 + 기존 테스트 100% 통과 |
| **SCOPE** | 29개 파일 경로 문자열 치환 + `ideationPath()` 처리 + `tests/paths.test.js` 혼재 제거 + dogfooding 완수 |

---

## 0. Design 입력 요약

| 입력 | 결론 |
|------|------|
| Plan의 치환 매핑 (§5.2) | 7종 패턴 → `docs/{feature}/{phase}/main.md` 매핑 확정 |
| Plan의 SC-01~06 | 그대로 사용, 추가 확장 없음 |
| **`ideationPath()` 외부 호출자** | **0개** (grep 결과: `lib/paths.js:240` 정의, `:298` export 뿐) → **삭제 결정**. CSO Finding #4: grep 정적 한계 대비 **2-step deprecation 옵션** 기록 — (a) Do에서 즉시 삭제 (기본) / (b) `@deprecated` 경고 후 다음 minor에서 삭제. Do 단계에서 `node --test tests/` 통과로 간접 검증 후 (a) 채택 |
| Plan의 "sub-doc 허용" 정책 (§5.1) | 다중 산출물 에이전트(infra-architect 등)에 적용 |

---

## Architecture Options

| Option | 설명 | 복잡도 | 유지보수 | 구현 속도 | 리스크 | 선택 |
|--------|------|:------:|:--------:|:---------:|:------:|:----:|
| A. **Bulk sed 일괄 치환** | 7종 regex 패턴으로 전체 트리에 sed -i 일괄 적용 | 낮음 | 낮음 | 매우 빠름 | **높음** (오치환 + 백업 불가) | ✗ |
| B. **수동 Edit 파일별 치환** | 29개 파일을 Read → Edit으로 개별 수정 | 중 | 중 | 중 | 낮음 (diff 명확) | ✓ |
| C. **치환 스크립트 + 드라이런** | `scripts/migrate-docs-paths.js`를 만들어 드라이런 → 확인 → 적용 | 높음 | 높음 | 느림 | 낮음 | ✗ (YAGNI — 일회성) |

**Rationale**: 29개 파일이 **일회성 마이그레이션**이므로, 재사용 도구(C)는 과설계. A는 regex 오치환 리스크가 큼(예: `docs/00-ideation/{role}_{topic}.md` 형태의 주석 vs 실제 경로 문자열 구분 실패 가능). **B(수동 Edit)** 가 제어·리뷰 용이성 관점에서 최적. Claude Code의 Edit tool이 파일별 unique match를 강제하므로 회귀 최소화.

---

## Part 1: IA

### 1.1 사이트맵

N/A — 내부 구조 작업 (사용자 화면 없음).

### 1.2 네비게이션 구조

N/A

### 1.3 태스크 기반 유저플로우

N/A

### 1.4 화면 목록

N/A

---

## Part 2: 와이어프레임

N/A — UI 변경 없음.

---

## Part 3: UI 설계

N/A — UI 변경 없음.

---

## Part 4: Tech Stack Lock (CTO 전용)

| 영역 | Lang/Framework | 핵심 라이브러리 | 데이터/스토리지 | 금지 |
|------|----------------|----------------|----------------|------|
| Backend | N/A | N/A | N/A | N/A |
| Frontend | N/A | N/A | N/A | N/A |
| Auth/Infra | N/A | N/A | N/A | N/A |
| **Tooling** | **Node.js 18+** (기존) | **ripgrep** (검증), Claude Code Edit (치환) | N/A | bulk sed -i, 호환 레이어 도입 |

---

## Part 5: Implementation Contract (CTO 전용)

### 5.1 처리 순서 (Do 단계 실행 순서)

Plan의 원자성을 보장하기 위해 아래 순서를 엄격히 준수한다. 각 스텝 완료 후 중간 검증.

| # | 스텝 | 대상 | 검증 |
|---|------|------|------|
| 1 | `lib/paths.js` `ideationPath()` **삭제** + 관련 export/주석 제거 | `lib/paths.js` | `node --test tests/paths.test.js` 통과 (해당 테스트 없음 확인) |
| 2 | `lib/paths.js` line 227 레거시 주석을 `docs/_legacy/...` 또는 삭제 | `lib/paths.js` | eyeball |
| 3 | lib/ 나머지 **8개** 파일 치환 (단순 문자열 + 런타임 로직 1개) | doc-validator, migration-engine, state-machine-v050, agent-registry, cp-guard, advisor/prompt-builder, advisor/wrapper, control/cost-monitor, **`quality/template-validator.js`** (CSO Finding #1 추가 — `'01-plan/'` → `'/plan/'` 등 **sep 경계 치환**. fallback 분기는 최소 변경 원칙으로 유지) | `node --test tests/` 통과 |
| 4 | agents/cto/ 7개 에이전트 문서 rewrite | 7개 md | `node scripts/vais-validate-plugin.js` 통과 |
| 5 | agents/cpo/ 3개 + coo/ 1개 + _shared/ 1개 | 5개 md | 동 |
| 6 | skills/ 2개 치환 | ideation.md, init.md | 동 |
| 7 | scripts/ 2개 + tests/scenario-verification.test.js | 3개 파일 | `node --test tests/` 통과 |
| 8 | **README.md + CLAUDE.md + vendor/README.md 치환** | 3개 md | (a) `README.md:238` 라인 치환 (b) **`README.md:277-282` 구조 설명 블록 6줄 rewrite** (단순 치환이 아닌 `docs/{feature}/{phase}/main.md` 형식으로 재작성) (c) `CLAUDE.md:29` 주석 치환 (d) `vendor/README.md` 경로 참조 갱신. 마크다운 링크 깨짐 확인. CSO Finding #3 반영 |
| 9 | **`tests/paths.test.js` 리라이트**: line 94~109 옛 구조 테스트를 새 구조로 rewrite | 1개 파일 | `node --test tests/paths.test.js` 전체 통과 |
| 10 | SC-01 최종 grep 검증 | 전체 트리 | `rg 'docs/\d\d-' --glob '!docs/_legacy/**' --glob '!CHANGELOG.md'` = 0줄 |

### 5.2 치환 규칙 상세

#### 5.2.1 Role-prefix 제거 원칙

v0.52 이전 파일명 규칙이던 `{role}_{feature}.{phase}.md`는 폐기. 새 구조는 **role과 무관한 단일 경로**. 이유: 같은 피처에 여러 C-Level이 참여할 때 phase 폴더 내에서 역할 구분이 오히려 혼선을 유발 (예: CTO가 plan을 썼는데 CPO가 보강하면 파일이 두 개가 됨).

**예외 (sub-doc)**: 다중 산출물이 필요한 경우만 `docs/{feature}/{phase}/{sub}.md` 허용. `main.md`는 항상 인덱스 역할.

#### 5.2.2 에이전트 문서 rewrite 템플릿

agents/cto/infra-architect.md 같은 실행 에이전트에서 경로를 언급하는 모든 구문은 아래 템플릿을 따른다.

| Before (레거시) | After (피처 중심) | 비고 |
|-----------------|-------------------|------|
| ``docs/01-plan/cto_{feature}.plan.md`` | ``docs/{feature}/01-plan/main.md`` | CTO 기본 plan |
| ``docs/02-design/cto_{feature}.design.md`` | ``docs/{feature}/02-design/main.md`` | CTO 기본 design |
| ``docs/02-design/infra-architect_{feature}.design.md`` | ``docs/{feature}/02-design/infra.md`` | **sub-doc 예외 적용** (infra 특화 산출물) |
| ``docs/03-do/{role}_{feature}.do.md`` | ``docs/{feature}/03-do/main.md`` | 실행 산출물 |
| ``docs/04-qa/{role}_{feature}.qa.md`` | ``docs/{feature}/04-qa/main.md`` | QA 산출물 |
| ``docs/05-report/{role}_{feature}.report.md`` | ``docs/{feature}/05-report/main.md`` | 보고서 |
| ``docs/00-ideation/{role}_{topic}.md`` | ``docs/{topic}/ideation/main.md`` | topic = feature로 해석 |

#### 5.2.3 `ideationPath()` 삭제 세부 설계

**결정**: grep 결과 외부 호출자가 0개이므로 **함수 자체를 삭제**한다. `module.exports` 목록에서도 제거.

```text
lib/paths.js 변경 항목:
  - 삭제: function ideationPath(role, topic) { ... }  (line 236-244)
  - 삭제: module.exports의 ideationPath (line 298)
  - 갱신: line 227 주석 → 레거시 참조 제거
  - 유지: validateComponent, featureOutputPath, checkpointPath, resumePath (현재 호출자 별도 확인 필요 없음 — 피처 중심 구조 유지)
```

**호환 레이어 불필요 사유**: 호출자가 없으므로 breaking change 아님.

### 5.3 State Machine

N/A — 단순 치환 작업, 상태 전이 없음.

---

## 재발 방지 설계 (Report 단계 제안 항목)

Design 단계에서 결정하지 않되, report에서 사용자에게 제안할 선택지:

| 옵션 | 설명 | 도입 비용 |
|------|------|----------|
| (a) **Pre-commit hook**: `rg 'docs/\d\d-' --glob '!docs/_legacy/**'` = 0 강제 | 재발 즉시 차단 | 낮음 |
| (b) **CI grep guard**: PR 단계 검증 | 리뷰 시점 차단 | 낮음 |
| (c) **CLAUDE.md Rule 추가**: "레거시 경로 참조 금지" 명시 | LLM 가이드라인 | 0 |

> 도입 여부는 report 단계 사용자 의사결정.

---

## Session Guide

### Module Map

| Module | Files | Description |
|--------|-------|-------------|
| M1. lib runtime | `lib/paths.js` + lib/ 7개 | 런타임 경로 처리 로직 |
| M2. agents | `agents/` 12개 md | C-Level 에이전트 지시문 |
| M3. skills & utils | `skills/` 2개 | 워크플로우 스킬 |
| M4. auxiliary | `scripts/` 2개 + `tests/scenario-verification.test.js` + README 2개 | 검증·문서 부속 |
| M5. paths.test rewrite | `tests/paths.test.js` line 94~109 | 테스트 정합성 |

### Recommended Session Plan

| Session | Modules | Description |
|---------|---------|-------------|
| Session 1 | M1 | 런타임부터 진입 — `ideationPath()` 삭제 + lib 치환. 테스트 통과 확인. |
| Session 2 | M2 + M3 | 에이전트·스킬 문서 일괄 rewrite. 플러그인 validator 통과. |
| Session 3 | M4 + M5 | 부속 파일 + 테스트 리라이트 + 최종 grep 검증(SC-01). |

> 단일 Do 세션으로도 가능하나, 세션 경계마다 `node --test tests/`를 실행하여 회귀 격리 권장.

---

## Design 검증 체크리스트

- [x] Plan의 모든 Success Criteria가 Design에 반영됨
- [x] 치환 매핑이 코드 수준으로 명확함 (§5.2)
- [x] `ideationPath()` 처리 방향 확정 (삭제)
- [x] Do 단계 실행 순서가 원자적·검증 가능 (§5.1)
- [x] sub-doc 규칙이 infra-architect 케이스로 구체화됨
- [ ] Do 단계 진입 전 Plan/Design 크로스 리뷰 (Do 진입 시 수행)

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-17 | 초기 작성 — 수동 Edit 일괄 치환 전략 확정, `ideationPath()` 삭제 결정(외부 호출자 0개 확인), 10스텝 실행 순서 정의 |
| v1.1 | 2026-04-17 | CSO Design Review 반영 — §0 `ideationPath()` 2-step deprecation 옵션 기록, §5.1 step 3 대상에 `template-validator.js` 추가(7→8개), §5.1 step 8 README/CLAUDE.md 라인 단위 구체화 |

<!-- template version: v0.18.0 -->
