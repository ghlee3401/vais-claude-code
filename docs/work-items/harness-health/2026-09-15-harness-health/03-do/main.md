---
schema: vais-phase/v1
work_item: WI-2026-09-15-harness-health
phase: do
revision: 1
status: draft
based_on: []
---

# Do — 안전·건강 (QA 수정 1회차 반영)

## 변경 (구현)

| REQ | 파일 | 요지 |
|---|---|---|
| 001·002 | `lib/workflow/v2/config.js`(신규), hook 4종 | `resolveMode()` 정규화·닫힘·경고, 스위치 off. 예외는 `failLoudContext` 경고 (순수 함수, 테스트) |
| 003 | `write-policy.js` | `git -C` 읽기, `--version`, doctor 스크립트 읽기 허용. `$TMPDIR/claude-*` scratch 쓰기 |
| 004 | `config.js`, store 2, `vais.config.json` | leaseMs·TTL 설정 연결, `managedPrefix` 삭제·알 수 없는 키 보고 |
| 005 | `naming.js`, `router.js`, prompt hook, CLI | slug null → 이름 요청, `이름:` → requestSlug, `assertNewFeatureSlug` 거부 |
| 006·007 | `router.js`, prompt hook | 합성 승인 문장 제거, help/doctor action, `01-plan/draft.md` 지침 |
| 008 | `phase-transaction.js`, schema | receipt `runtime {plugin, node, claudeCode}` |
| 009 | `doctor.js`, `vais-doctor.js`(신규), CLI, `write-policy.js` | 점검 9종. 무인가 runtime `doctor` 허용은 placeholder 와 guard 설치 경로(`trustedRuntimePrefixes`)만 신뢰 |
| 010 | `tests/regression/`, package.json | 장면 F 4경로, `npm run regression` |
| 011·012 | `docs/harness/*`, manifests, README, CHANGELOG, CLAUDE, ONBOARDING, SKILL | 억지력·13절·diff-summary·config·오설정 잠금·`runtime` 표기, 3.1.0 동기화 |

기존 테스트 4건을 새 규칙에 맞게 고쳤고, 이번 회차에 hook 예외·doctor 읽기·무인가 doctor(비신뢰 경로 거부 포함) 테스트 3건을 더했다.

## 증거 (검증)

- `node --test tests/*.test.js` 170 통과, `tests/regression` 5 통과, lint 경고 0, validator 오류 0.
- readiness `test`·`lint`·`plugin-validator` 는 transaction 이 재실행.
- 1차 QA FAIL(TC-009)·보완(REQ-001 예외 테스트, 8절 표기) 반영. REQ-004 prefix 는 승인된 Design 이 Plan 문구를 대체.
- 실행 중 하네스는 캐시 3.0.1 이라 hook 실동작은 업데이트 뒤 확인.
