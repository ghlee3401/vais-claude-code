# docs-structure-redesign - 구현 로그

> ⚙️ **Do 단계 산출물**: plan+design에서 결정된 10스텝을 실제 코드로 실행한 로그.
> 참조: `docs/docs-structure-redesign/01-plan/main.md`, `docs/docs-structure-redesign/02-design/main.md`, `docs/docs-structure-redesign/02-design/cso-review.md`

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **실행 범위** | 30개 파일 레거시 경로 치환 + `ideationPath()` 삭제 + `tests/paths.test.js` 리라이트 + dogfooding 완성 |
| **결과** | 모든 Success Criteria 달성 — 테스트 0 fail, 플러그인 validator 통과, dogfooding 4개 문서 생성 |
| **변경 규모** | 30개 파일 modify + 4개 문서 create (plan, design, cso-review, do) |
| **검증 신호** | `node --test tests/` 175 pass / 0 fail / 3 skip, `vais-validate-plugin.js` 오류 0 경고 0 |

---

## 실행 결과 요약 (10 스텝)

| # | 스텝 | 상태 | 변경 파일 | 검증 |
|---|------|:----:|----------|------|
| 1-2 | `lib/paths.js` `ideationPath()` 삭제 + 주석 갱신 | ✅ | 1 | 테스트 regression 없음 |
| 3 | lib/ 9개 파일 치환 (template-validator 포함) | ✅ | 9 | 전체 테스트 통과 |
| 4 | agents/cto/ 7개 rewrite | ✅ | 7 | plugin validator 통과 |
| 5 | agents/cpo/ 3 + coo/ 1 + _shared/ 1 rewrite | ✅ | 5 | plugin validator 통과 |
| 6 | skills/ 2개 rewrite | ✅ | 2 | — |
| 7 | scripts/ 2 + tests/scenario-verification 치환 | ✅ | 3 | 테스트 통과 |
| 8 | README.md + CLAUDE.md + vendor/README.md rewrite | ✅ | 3 | — |
| 9 | `tests/paths.test.js` 리라이트 + 회귀 가드 추가 | ✅ | 1 | **11/11 pass** (이전 8/10 → 11/11) |
| 10 | 최종 grep 검증 + Do 문서 작성 | ✅ | 1(본문) | SC-01 통과 |

**총계**: 31개 파일 modify + 1개 create (본 Do 문서). Plan의 30개 target 전부 + `tests/paths.test.js`의 리라이트로 +1.

---

## Success Criteria 검증 결과

| ID | Criterion | 결과 | 증거 |
|----|-----------|:----:|------|
| SC-01 | 레거시 경로 전수 제거 | ✅ **Met** | `git grep "docs/[0-9][0-9]-"` 결과 2줄만 잔존 — 모두 의도된 참조 (README `_legacy/` 안내 + paths.test.js 회귀 가드 문자열). 실사용 참조 0 |
| SC-02 | `ideationPath()` 삭제 | ✅ **Met** | `lib/paths.js`에서 함수·export 제거 완료. 후속 테스트 통과로 간접 검증 |
| SC-03 | paths.test.js 리라이트 후 `tests/` 전체 100% | ✅ **Met** | **175 pass / 0 fail** (이전 baseline: 3 fail) |
| SC-04 | paths.test.js 레거시 구조 검증 케이스 제거 | ✅ **Met** | line 92-109 옛 케이스를 피처 중심으로 rewrite + 회귀 가드 1건 추가 (총 3 → 11 tests) |
| SC-05 | 플러그인 구조 무결성 | ✅ **Met** | `vais-validate-plugin.js` 오류 0 / 경고 0 / 정보 8 |
| SC-06 | dogfooding | ✅ **Met** | `docs/docs-structure-redesign/` 하위에 plan/design/do 각 main.md + design sub-doc (cso-review.md) 4개 산출물 |

---

## 변경 파일 인벤토리 (31개)

### Runtime (9)
- `lib/paths.js` — `ideationPath()` 삭제, 주석 정리
- `lib/core/state-machine-v050.js` — `@see` 주석 `_legacy/` prefix
- `lib/core/migration-engine.js` — 동
- `lib/registry/agent-registry.js` — 동
- `lib/advisor/prompt-builder.js` — 동
- `lib/advisor/wrapper.js` — 동
- `lib/control/cost-monitor.js` — 동
- `lib/validation/cp-guard.js` — 동
- `lib/validation/doc-validator.js` — 동
- `lib/quality/template-validator.js` — **런타임 phase 추출 로직** `01-plan/` → `/plan/` sep 경계 치환 (CSO Finding #1 반영)

### Agents (12)
- `agents/cto/`: infra-architect, backend-engineer, frontend-engineer, test-engineer, ui-designer, db-architect, incident-responder (7개)
- `agents/cpo/`: prd-writer, product-researcher, product-strategist (3개)
- `agents/coo/`: performance-engineer (1개)
- `agents/_shared/`: ideation-guard (1개)

### Skills (2)
- `skills/vais/phases/ideation.md`
- `skills/vais/utils/init.md`

### Scripts & Tests (4)
- `scripts/check-cc-advisor-support.js` — `@see` 주석
- `scripts/refactor-audit.js` — `@see` 주석 2개 + `DEFAULT_BASELINE` 경로
- `tests/scenario-verification.test.js` — S-0 디렉토리 검증을 템플릿 존재 검증으로 변경
- `tests/paths.test.js` — line 94-109 리라이트 + 회귀 가드 추가 (총 +9 lines)

### Docs & README (3)
- `README.md` — line 238 ideation 저장 경로, line 275-283 Document Structure 블록 rewrite
- `CLAUDE.md` — line 29 주석 갱신
- `vendor/README.md` — line 48 design 경로

---

## 주요 설계 결정 적용 기록

### D1. `ideationPath()` 삭제 방식 (Design §0 — 옵션 (a) 즉시 삭제)

- grep 검증: 외부 호출자 0개 확인 (`lib/paths.js` 내부 정의/export만)
- 실행: 함수 정의(line 236-244) + export(line 298) + 상단 주석 블록 일괄 삭제
- 2-step deprecation은 채택하지 않음 — 테스트 통과로 간접 검증 완료, 배포 전 단일 minor 내에서 해결 가능

### D2. template-validator의 sep 경계 치환 (CSO Finding #1)

- Before: `filePath.includes('01-plan/')` — phase 번호 의존
- After: `filePath.includes('/plan/')` — sep 경계 기반, 피처 중심 구조 호환
- `.plan.md` 확장자 fallback은 유지 (호환성, 최소 변경 원칙)

### D3. sub-doc 규칙 실적용

- `infra-architect`: `docs/{feature}/02-design/infra.md`
- `backend-engineer`, `frontend-engineer`: `docs/{feature}/02-design/interface-contract.md`
- `product-researcher`: `docs/{feature}/03-do/research.md`
- `product-strategist`: `docs/{feature}/03-do/strategy.md`
- `ui-designer` review: `docs/{feature}/02-design/review.md`
- 본 피처 dogfooding: `docs/docs-structure-redesign/02-design/cso-review.md`

### D4. 주석 vs 실체 참조 구분

- `@see docs/01-plan/features/v050/*.plan.md` 형식의 **역사적 참조 주석**은 `docs/_legacy/` prefix 추가로 유효성 유지 (총 10개 파일)
- 이유: 실제 파일이 `_legacy/`에 존재하므로 참조 깨지지 않음 + 역사 기록 가치

### D5. scripts/refactor-audit.js의 baseline 경로

- `DEFAULT_BASELINE`: `docs/03-do/...` → `docs/_legacy/03-do/...`
- 이 스크립트는 수동 유틸리티로 현재 hooks/CI 연동 없음. 호출 시 `_legacy/` 하위에 baseline 쓰기/읽기. 추후 필요 시 `.vais/audit/`로 이관 제안 (범위 밖)

### D6. scenario-verification.test.js S-0 테스트 의미 재정의

- Before: `fileExists('docs/00-ideation')` — 디렉토리 고정 위치 존재
- After: `fileExists('templates/ideation.template.md')` + `fileExists('docs')` — 시나리오 실행 가능성 검증
- 이유: 피처 중심 구조에선 ideation 산출물이 `docs/{feature}/00-ideation/main.md`에 동적 생성되므로 고정 디렉토리 존재는 더 이상 유효한 지표 아님

---

## 테스트 상태 변화 (Before / After)

| 지표 | Before (Plan 시점) | After (Do 완료) | 변화 |
|------|-------------------:|----------------:|:----:|
| `tests/paths.test.js` | 8 pass / 2 fail / 10 total | 11 pass / 0 fail / 11 total | ✅ +3 pass, -2 fail |
| `tests/` 전체 | 171 pass / 3 fail / 174 total | 175 pass / 0 fail / 178 total | ✅ +4 pass, -3 fail, +4 tests |
| `vais-validate-plugin.js` | 오류 0 / 경고 0 | 오류 0 / 경고 0 | — 불변 |

Skipped 3건은 환경 의존 테스트(기존부터 skip).

---

## 잔존 grep 결과 (의도된 2줄)

```text
README.md:287: > v0.52 이전의 phase 중심 구조(`docs/00-ideation/`, `docs/01-plan/` 등)는
              `docs/_legacy/`로 이관되었습니다. ...
tests/paths.test.js:112: it('레거시 경로(docs/01-plan/...)는 더 이상 findDoc에서
                         매치되지 않는다 (회귀 가드)', () => {
```

- **README.md:287** — `_legacy/` 이관 안내의 역사적 레퍼런스. **의도됨**.
- **tests/paths.test.js:112** — 레거시 경로 사용 금지 **회귀 가드 테스트 타이틀**. **의도됨** (SC-04 강화).

두 항목 모두 실행 경로가 아닌 설명/가드 목적. SC-01의 본래 의도인 "런타임·에이전트 지시 참조 전수 제거"는 **완전 달성**.

---

## 리스크 / 후속 작업

### 완료된 Advisory 해소
- ✅ Finding #1: template-validator sep 경계 치환
- ✅ Finding #2: SC-03 baseline 오류 → paths.test.js 리라이트로 해소
- ✅ Finding #3: README/CLAUDE.md 라인 단위 적용
- ✅ Finding #4: `ideationPath()` 테스트 통과로 간접 검증

### QA 단계로 이관할 항목
- SC-01~06 최종 평가 (Met/Partial/Not Met)
- 커밋 전 CHANGELOG.md 0.52.1 또는 0.53.0 엔트리 초안
- Advisory Finding #5 (template-validator fallback dead code) — 정리 여부 판단

### Report 단계 제안 보존
- 재발 방지 CI grep guard 옵션 3종 (pre-commit / CI / CLAUDE.md rule) — 사용자 결정 사항

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-17 | 초기 작성 — 10 스텝 전부 완료 기록, SC-01~06 모두 Met, 31개 파일 modify 인벤토리 |
