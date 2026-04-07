# cto-plan-prd-consumption - 구현 로그

> 참조: `docs/01-plan/cto_cto-plan-prd-consumption.plan.md` (v1.1) + `docs/02-design/cto_cto-plan-prd-consumption.design.md` (v1.1)
> 범위: B (표준) + F8/F9 (실행 버그 반영)

## 1. 구현 결정사항

| # | 결정 | 이유 | Design 대비 변경 |
|---|------|------|-----------------|
| 1 | CP-0 신설을 `cto.md`의 새 섹션으로 인라인 (Option C) | 본 피처 범위 유지하며 추후 추출 가능 | 없음 |
| 2 | F9(AskUserQuestion 강제)를 "최우선 규칙" 영역에 명시 | 다른 모든 지시보다 우선이라 최상위 위치 | 추가 (v1.1 스코프 확장) |
| 3 | F8(표 펜스 분리)을 "최우선 규칙"에 별도 항목 + CP-1/D/G/2/Q 5개 템플릿 일괄 수정 | 단일 진실원에 규칙 정의 + 모든 출력 템플릿 일괄 정리 | CP-G도 함께 정리 (디자인엔 4개로 명시했지만 5개로 확장) |
| 4 | `gates.cto.plan` 키를 `orchestration` 다음에 신설 | 기존 키 영향 없는 위치 | 없음 |
| 5 | `requirePrd` 기본값 `"ask"` | 신규 사용자에게 명시적 결정 유도 (User Sovereignty) | 없음 |
| 6 | `completenessThreshold` 기본 6 | 8개 섹션 중 75% 매칭, 휴리스틱으로 합리적 | 없음 |
| 7 | plan.template `0.7 PRD 입력` 섹션 추가, "(N/A — CTO 전용)" 안내 포함 | 다른 C-Level이 사용 시 혼란 방지 | 없음 |
| 8 | CPO 핸드오프 안내 1줄 변경 (F7, Nice) | Nice 우선순위지만 1줄이라 함께 처리 | 없음 |
| 9 | F8을 CP-G까지 확장 (디자인은 CP-1/D/2/Q 4개만 명시) | CP-G도 동일한 표 렌더링 문제 가능 → 일관성 | 디자인 대비 +1 템플릿 |

## 2. 변경 파일 목록

| # | 파일 | 변경 유형 | 라인 변동 |
|---|------|----------|----------|
| 1 | `vais.config.json` | modify | +16 (gates.cto.plan 블록 신설) |
| 2 | `agents/cto/cto.md` | modify | +110 / -75 (CP-0 신설, 최우선 규칙 보강, CP-1/D/G/2/Q 템플릿 펜스 분리, Context Load L0 추가, Checkpoint 표 행 추가, PDCA 표 본문 수정) |
| 3 | `templates/plan.template.md` | modify | +30 (0.7 PRD 입력 섹션 신설) |
| 4 | `agents/cpo/cpo.md` | modify | +0/-0 (1줄 inline 수정) |
| 5 | `docs/01-plan/cto_cto-plan-prd-consumption.plan.md` | modify | +3 (v1.1 — F8/F9 추가) |
| 6 | `docs/02-design/cto_cto-plan-prd-consumption.design.md` | modify | +6 (v1.1 — 변경 매트릭스 확장) |
| 7 | `docs/03-do/cto_cto-plan-prd-consumption.do.md` | create | (이 문서) |

**총**: 1개 생성 + 6개 수정. 신규 코드 0줄 (모두 마크다운 + JSON).

## 3. Design 이탈 항목

| # | 이탈 | 이유 |
|---|------|------|
| 1 | F8 적용 범위를 CP-1/D/2/Q (4개) → CP-1/D/G/2/Q (5개)로 확장 | CP-G도 동일한 펜스 코드 블록 패턴이라 빠뜨리면 회귀 위험. 작업 비용 추가 미미 (~10 lines) |
| 2 | "최우선 규칙" 섹션에 F9/F8을 별도 항목으로 추가 | 디자인은 "내용 보강"으로만 표현했지만, 실제 구현은 별도 ` ⛔` 항목으로 분리해 가독성 + 강제력 강화 |
| 3 | `_completenessDescription` 등 self-documenting 키를 config에 포함 | 디자인엔 명시 안 했지만 사용자가 config 직접 편집 시 발견하기 쉽도록 추가 |

## 4. 미완료 항목

| # | 항목 | 상태 | 다음 액션 |
|---|------|------|----------|
| 1 | F5 (CEO 핸드오프 메모리 컨텍스트 `prd_skip_reason`) | V2 | 별도 피처 `cross-clevel-handoff-context`로 분리 검토 |
| 2 | F8 (피처명 의미 분석 기반 동적 권장) | V2 | LLM 호출 비용 측정 후 결정 |
| 3 | 본 피처 자체 dogfooding | QA에서 확인 | 다음 신규 피처 진행 시 CTO plan 진입에서 CP-0 발동 여부 관찰 |
| 4 | README 업데이트 (`requirePrd` 옵션 안내) | 미실시 | report 단계에서 처리 |

## 5. 발견한 기술 부채

| # | 부채 | 우선순위 | 비고 |
|---|------|---------|------|
| 1 | 다른 C-Level(CSO/CMO/COO/CPO/CFO)의 plan 진입 검사 패턴이 통일되어 있지 않음 | Medium | 본 피처를 패턴으로 향후 확장 검토 |
| 2 | `templates/plan.template.md`의 0.7 섹션이 CTO 외에는 N/A — 템플릿 분기 또는 별도 템플릿 검토 필요 | Low | 현재는 안내 1줄로 충분 |
| 3 | CP 출력 템플릿이 cto.md에 인라인 — 다른 C-Level이 같은 패턴 도입 시 중복 발생 | Low | `skills/vais/utils/cp-templates.md` 추출 검토 (V2) |
| 4 | `vais-validate-plugin.js`가 `gates.cto.plan` 키 검증 안 함 | Low | 신규 키 검증 추가 검토 |

## 6. 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-07 | 초기 작성 — Do 단계 완료 |
