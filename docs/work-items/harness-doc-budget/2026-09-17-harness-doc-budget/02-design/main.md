---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-doc-budget
phase: design
revision: 1
status: approved
based_on: []
---

# Design — 문서 예산 상향과 설정화 (harness-doc-budget)

## 1. 접근

기본값 표를 약 1.4배로 올려 실측 최대가 모두 75% 아래에 오게 하고, 같은 표를 `vais.config.json > documentBudgets` 로 부분 덮어쓸 수 있게 한다. 검사 논리·예외 승인·복사 금지는 그대로다. 위임 없음.

## 2. REQ 별 동작 · 입력 · 출력 · 오류 · 결정 · TC

| REQ | 동작 | 입력 | 출력 | 오류 | 구현 결정 | TC |
|---|---|---|---|---|---|---|
| REQ-001 | 기본값 상향 | 아래 표 | `DOCUMENT_BUDGETS`·`STAGE_PHASE_BUDGETS` 새 값 | — | 1024 배수로 올림. 실측 최대/새 한도: standard design 10,208/14,336=71%, plan·review 6,110/9,216=66%, do 3,131/5,120=61%, extended design 12,980/26,624=49%(예외 승인 28,280 은 여전히 초과·예외 유지) | TC-001 |
| REQ-002 | 설정 덮어쓰기 | `vais.config.json > documentBudgets.{compact\|standard\|extended\|stage}.{phase}` | 병합된 예산 | 양의 정수가 아니면 그 값만 무시·doctor `document-budgets` warn | `config.js` 에 `loadDocumentBudgets(root)` (기본값 깊은 병합, 무시한 키 목록 반환). `evaluateDocumentBudget` 은 path 형이면 root 에서 읽고, 객체 형이면 `input.budgets` 를 받는다. 기존 상수는 기본값으로 export 유지 | TC-002 |
| REQ-003 | 초과 메시지 | bytes·limit·scale·phase | 사용자 말 finding | — | "본문 {n}B 가 {scale} {phase} 한도 {limit}B 를 넘는다. ① 본문 줄이기 ② `--scale` 올리기 ③ `vais.config.json > documentBudgets.{scale}.{phase}` 올리기". extended 는 ③ 대신 "frontmatter `budget_exception`(reason, approved_by: user)" | TC-003 |
| REQ-004 | 문서·버전 | — | 4.1.0 | — | CLAUDE 규칙 12·README·`docs/harness/design.md` 대응표 행에 새 표와 설정 키. `vais.config.json` 에 `documentBudgets` 블록(빈 객체 + `_documentBudgets` 설명). doctor unknown-keys 안내문에 키 추가. CHANGELOG [4.1.0], 버전 7면 | TC-004 |

새 기본값 (B):

| 규모 | plan | design | do | review | report |
|---|---|---|---|---|---|
| compact | 8192 | 12288 | 4096 | 7168 | 4096 |
| standard | 9216 | 14336 | 5120 | 9216 | 4096 |
| extended | 14336 | 26624 | 8192 | 14336 | 7168 |
| stage 단계 문서 | 3072 | 8192 | 4096 | 6144 | 4096 |

## 3. 결정

- 예산 원칙은 유지하고 값만 올린다. 기준은 "지난 실측 최대가 새 한도의 75% 이하" 이며 1.4배·1024 배수로 정했다. 80자 복사 금지·extended 예외 승인은 그대로.
- 설정 키는 최상위 `documentBudgets` 다(`workflowV2` 아래가 아님). 부분 덮어쓰기를 허용하고, 잘못된 값은 그 칸만 무시해 닫힘으로 동작한다.
- 버전은 4.1.0. 하네스 판정이 바뀌므로 minor 다.

## 4. 전문 영역

| 영역 | 판단 |
|---|---|
| 데이터 계약 | 필요 — config 키 추가는 `vais.config.json` 키 구조 변경이라 이 Design 승인이 사전 합의다. schemas/ 는 손대지 않음 |
| 보안·UI·성능 | 불필요 |

## 5. 담당 · 쓰기 범위

main voice 직접, 위임 없음. 쓰기 범위: `lib/workflow/v2/document-quality.js`, `lib/workflow/v2/config.js`, `lib/workflow/v2/doctor.js`, `vais.config.json`, `tests/**`, `README.md`, `CLAUDE.md`, `ONBOARDING.md`, `docs/harness/design.md`, `CHANGELOG.md`, `package.json`, `package-lock.json`, `.claude-plugin/**`.

## 6. readiness · review

readiness: `test`, `lint`, `plugin-validator`. review: `secret-scan` + 독립 QA(읽기 전용)가 표·설정·메시지·버전을 대조한다.

## 7. TC

| TC | 검증 | 기대 |
|---|---|---|
| TC-001 | 새 표의 20칸이 코드와 같고, 한도±1 경계 테스트 통과, 지난 55개 실측(예외 1건 제외) 전부 새 한도의 75% 이하 | 일치 |
| TC-002 | 설정 덮어쓰기(한 칸만) 반영, 누락 시 기본값, `0`·`-1`·`"x"` 는 무시 + doctor warn | 세 경우 테스트 통과 |
| TC-003 | 초과 finding 에 ①②③ 세 선택지, extended 는 예외 안내 | 문자열 포함 |
| TC-004 | 버전 7면 4.1.0, CHANGELOG [4.1.0], CLAUDE 규칙 12·README·design.md 에 새 표와 `documentBudgets`, `npm test`·회귀·lint·validate PASS, doctor fail 0 | 일치 |

## 8. rollback

`git checkout -- lib/workflow/v2 vais.config.json tests README.md CLAUDE.md ONBOARDING.md docs/harness/design.md CHANGELOG.md package.json package-lock.json .claude-plugin`.
