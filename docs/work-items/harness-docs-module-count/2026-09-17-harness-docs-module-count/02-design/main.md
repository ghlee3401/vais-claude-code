---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-docs-module-count
phase: design
revision: 1
status: approved
based_on: []
---

# Design — 모듈 수 표기 통일과 기준 줄 손질 (harness-docs-module-count)

## 1. 접근

네 파일에서 각 한 줄만 바꾼다. 수는 Design 시점 재계산 값 38(변동 없음)을 쓰고, 세 문서가 같은 기준 문구("38 모듈")를 갖게 한다. README 기준 줄은 단어 하나만 정확하게 고친다. 위임 없음.

## 2. REQ 별 동작 · 입력 · 출력 · 오류 · 결정 · TC

| REQ | 동작 | 입력 | 출력 | 오류 | 구현 결정 | TC |
|---|---|---|---|---|---|---|
| REQ-001 | 모듈 수 통일 | `ls lib/workflow/v2` = 38 | `CLAUDE.md` 34행 "35 모듈:" → "38 모듈:", `ONBOARDING.md` 33행 "(35 모듈)" → "(38 모듈)" | 수가 다르면 QA FAIL | 문자열 치환만. 모듈 나열·흐름도 구조 유지 | TC-001 |
| REQ-002 | 기준 줄 손질 | `docs/harness/README.md` 기준 줄 | "hook 이벤트는 `hooks/hooks.json` 의 최상위 키 수" → "hook 이벤트는 `hooks/hooks.json` 의 `hooks` 아래 키 수" | — | 그 문장의 다른 부분은 유지 | TC-002 |
| REQ-003 | 변경 기록 | `CHANGELOG.md` `[Unreleased]` | Changed 에 불릿 1개 추가 | — | 기존 불릿 아래 한 줄. 버전 7면 4.0.1 유지 | TC-003 |

## 3. 결정

- 모듈 수 표기는 세 문서 모두 "38 모듈" 로 쓰고, 기준(폴더의 js 파일 수, index.js 포함)은 README 기준 줄 한 곳에만 둔다. CLAUDE·ONBOARDING 은 수만 적는다.
- 버전은 4.0.1 유지. 이번도 문서만 바뀐다.

## 4. 전문 영역

| 영역 | 판단 |
|---|---|
| 데이터 계약·보안·UI·성능 | 불필요 — 마크다운 네 줄 |

## 5. 담당 · 쓰기 범위

main voice 직접, 위임 없음. 쓰기 범위: `CLAUDE.md`, `ONBOARDING.md`, `docs/harness/README.md`, `CHANGELOG.md`.

## 6. readiness · review

readiness: `plugin-validator`. review: `secret-scan` + 독립 QA(읽기 전용)가 grep 과 파일 수로 대조한다.

## 7. TC

| TC | 검증 | 기대 |
|---|---|---|
| TC-001 | 저장소 grep "35 모듈" 0건(docs/work-items·CHANGELOG 제외). CLAUDE.md·ONBOARDING.md·docs/harness/README.md 의 모듈 수가 모두 38 이고 `ls lib/workflow/v2` 의 .js 파일 수와 같다 | 일치 |
| TC-002 | README 기준 줄에 "`hooks` 아래 키 수" 가 있고 "최상위 키" 가 없다. hooks.json 의 `hooks` 아래 키를 세면 5 | 일치 |
| TC-003 | CHANGELOG `[Unreleased]` Changed 에 이 작업 불릿 존재, 버전 6곳 4.0.1 | 일치 |

## 8. rollback

`git checkout -- CLAUDE.md ONBOARDING.md docs/harness/README.md CHANGELOG.md`.
