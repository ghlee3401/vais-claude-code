---
schema: vais-phase/v1
work_item: WI-2026-09-16-feature-bug-kinds
phase: review
revision: 1
status: approved
based_on: []
---

# Review — feature-bug-kinds (QA 2회차)

## 요구사항

REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010

## 테스트

TC-001, TC-002, TC-003, TC-004, TC-005, TC-006, TC-007, TC-008, TC-009, TC-010 — 단위 `tests/v2-feature-bug.test.js` 11건(Design TC-001~008 대응)·장면 B·D(TC-009) 를 독립 QA 가 직접 실행, 문서·버전(TC-010) 은 파일 대조.

## 입력 · 출력

입력은 feature·bug Design 본문(`## 인용`·`## 신규`·`## 재현`)과 `.vais/v2/chain-index.json`, `vais.config.json > ui.run` 이고, 출력은 Design Gate finding, `docs/product/0N-*.md` 에 붙은 draft 항목, `구현됨` 도장, 회차 스크린샷, 장부 note 다.

## 기대 · 실제

- 기대: 없는 인용·잘못된 번호·미승인 단계·필수 항목 누락·stale 은 Design 제시 전에 거부 / 실제: 장면 B·D 와 단위 TC 에서 `preflight failed` 메시지에 finding 이 담겨 거부됨.
- 기대: `do ready` READY 때만 정본에 붙고 index 는 draft / 실제: 장면 B 에서 F-003·API-003·TC-003 이 02·08·10 끝에 붙고 draft, Report 뒤 approved + implemented.
- 기대: 같은 작업이 Design 을 고쳐 다시 READY 가 되면 중복 없이 교체 / 실제: `### F-003` 1개, 새 문구 반영.
- 기대: bug 는 재현 PNG·원인·수정안·신규 TC 없이는 제시 불가, 재현 재실행 없는 Review 거부 / 실제: 장면 D 통과.
- 기대: `withApp` 이 앱을 띄우고 URL 응답 뒤 찍고 종료, 실패는 `APP_START_FAILED` / 실제: 단위 통과, 장면 B·D 가 static-server 로 실제 HTTP 앱 사용.
- 기대: 버전 7면 3.6.0, 문서 갱신(REQ-010) / 실제: 1회차 QA 가 `docs/harness/design.md` 회귀 세트 행과 `CLAUDE.md` 상태 줄 미갱신을 찾아 FAIL → Design 세부 수정 뒤 Do 에서 두 곳을 고침. 2회차 QA 가 두 곳 해소와 REQ-001~010·TC-001~010 전부를 직접 실행·대조해 PASS(npm test 228/228, 회귀 10/10, lint 0).

## 엣지 · 제한

- 조기 종료 감지는 Linux `/proc` 에 의존한다. 다른 OS 에서는 readyTimeoutMs 만료로만 실패한다.
- `withApp` 대기는 동기 폴링(300ms)이라 transaction 동안 다른 작업을 하지 않는다. 최대 대기는 readyTimeoutMs(기본 15s).
- 신규 항목은 정본 파일 끝에만 붙고 절 안 위치는 고르지 않는다. 사람이 정본을 손으로 재배치하면 stage 재승인이 필요하다.
- 화면 캡처는 테스트에서 stub 렌더러다. 실제 Chrome 렌더는 H4 단위 테스트가 덮는다.

## 증거

- `03-do/evidence/transactions/PT-1154e959-7b8e-4578-a0b8-90b20f0f9649.json` (readiness READY 2회차: test·lint·plugin-validator)
- `04-review/evidence/checks/secret-scan.json` PASS
- 독립 QA 1회차 `04-review/evidence/handoffs/AS-9338599b-c964-4487-8e72-996dcfb2d828.json` (FAIL, REQ-010), 2회차 `AS-70910e73-4d0e-4bb2-8a95-62e2fce4be94.json`
