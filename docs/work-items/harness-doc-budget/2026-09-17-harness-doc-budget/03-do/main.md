---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-doc-budget
phase: do
revision: 1
status: draft
based_on: []
---

# Do — harness-doc-budget

## 구현 변경

- REQ-001 기본값 표를 `lib/workflow/v2/config.js` 의 `DEFAULT_DOCUMENT_BUDGETS`·`DEFAULT_STAGE_PHASE_BUDGETS` 로 옮기고 Design 표 값으로 올렸다. `document-quality.js` 는 같은 이름(`DOCUMENT_BUDGETS`·`STAGE_PHASE_BUDGETS`)으로 재수출한다.
- REQ-002 `config.js` 에 `mergeDocumentBudgets(override)`·`loadDocumentBudgets(root)`. 규모 4종 × 단계 5종만 받고, `_` 로 시작하는 키는 주석, 그 밖의 키·양의 정수가 아닌 값은 `ignored` 목록에 남기고 기본값을 쓴다. `evaluateDocumentBudget` 은 path 형이면 프로젝트 설정을, 객체 형이면 `input.budgets` 를 병합한다. `doctor.js` 에 `document-budgets` 검사 추가(무시된 칸 warn, 덮어쓴 칸 수 pass). `vais.config.json` 에 `documentBudgets` 블록(설명 키만).
- REQ-003 초과 finding 을 `overflowFinding()` 으로 바꿨다: "본문 nB 가 {규모} {단계} 한도 mB 를 넘는다. ① 본문 줄이기 ② `--scale` 올리기(extended 는 `budget_exception` 예외 승인) ③ vais.config.json > documentBudgets.{규모}.{단계} 올리기". stage kind 는 규모 자리에 `stage`.
- REQ-004 README "문서 예산" 절(표 + 설정 + 세 갈래), CLAUDE 규칙 12·구조도·상태 줄, ONBOARDING 설정 표·상태 줄, design.md 대응표 행 1개, CHANGELOG [4.1.0](오늘 Unreleased 두 건 포함), 버전 7면 4.1.0. `package-lock.json` 루트 버전 3.0.1 → 4.1.0 도 같이 맞췄다(브리핑 제안 ②).
- Design 과 다른 점 하나: doctor 의 기존 `unknown-keys` 안내문은 `workflowV2` 블록 전용이라 손대지 않고, 최상위 `documentBudgets` 는 새 검사가 맡는다.

## 검증 증거

- 새 테스트 4개(`tests/v2-lean-document-quality.test.js` 끝, TC-001~003): 기본 표 20칸 일치, 실측 12 풀이 모두 새 한도의 75% 이하, 덮어쓰기·누락·오류 3경우 + doctor warn, 초과 문구 세 갈래.
- `npm test` 235/235, `npm run regression` 10/10, `npm run lint` 경고 0, `npm run doctor` fail 0 (version-sync 4.1.0 5곳 일치, document-budgets 기본값 사용).
- plugin-validator 는 `do ready` 가 실행한다. 위임 없음, handoff 없음.
