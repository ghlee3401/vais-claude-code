---
schema: vais-phase/v1
work_item: WI-2026-09-17-harness-diagram-skill
phase: review
revision: 1
status: approved
based_on: []
---

# Review — harness-diagram-skill

## 요구사항

REQ-001, REQ-002, REQ-003, REQ-004, REQ-005

## 테스트

TC-001, TC-002, TC-003, TC-004, TC-005 — 독립 QA 가 스킬 폴더 grep·테스트 재실행·문서·버전·증명 그림을 대조한다.

## 입력 · 출력

입력은 승인된 Design 의 REQ 표와 결정, `skills/diagram/**`, `router.js`·`config.js`·`diagram.js`·`write-policy.js`·prompt hook·CLI, `contracts/chain-stages.json`·스키마, 테스트·회귀, 문서 5개, 버전 파일이고, 출력은 스킬 스냅샷(11종), `/vais diagram` authorization, `diagram export`, 3단계 흐름 파일 렌더, 4.2.0 이다.

## 기대 · 실제

- TC-001 기대: SKILL ≤24KB, 유형 11, 금지어 0, 출처·LICENSE / 실제: QA 재확인(handoff). 예제 HTML 은 동봉하지 않음(아래 제한).
- TC-002 기대: 라우팅·allowedPaths·거부·설정 / 실제: `tests/v2-diagram.test.js` 통과.
- TC-003 기대: SVG 추출·범위 거부·stub PNG / 실제: 테스트 통과. 실제 Chrome PNG 는 `screens capture` 로 확인.
- TC-004 기대: 장면 A `.mmd` 통과·`.html` PNG, 계약 키, Design 지침 / 실제: 회귀 10/10, 단위 테스트 통과.
- TC-005 기대: 버전 9곳 4.2.0, 문서 4곳, test·lint PASS, 증명 PNG / 실제: test 241/241, lint 0, `03-do/evidence/diagram/desktop.png`.

## 엣지 · 제한

- 원본 예제 `assets/example-*.html` 은 authorization 30분 안에 복사하지 못해 이번엔 동봉하지 않았다. 유형 참조의 "Examples" 줄이 없는 파일을 가리킨다. 다음 작업에서 사용자가 `references/` 에서 복사하거나 예제 줄을 지운다(잔여 제한).
- `diagram export` CLI 는 실행 중 플러그인 캐시(4.1.0)에 없어 이번 턴에는 테스트로만 확인했다. push·업데이트 뒤 실제 사용이 첫 실행이다.
- Design 이 시킨 사용자 행동(clone, `.gitignore`)이 두 번 drift 로 잡혀 Do 가 Design 으로 되돌아갔고, authorization 30분이 큰 Do 에 짧았다(하네스 빈틈, Report 잔여 제한).
- QA 는 `npm run regression` 재실행을 요구하지 않았다(Do 에서 10/10).

## 증거

- `03-do/evidence/transactions/PT-f2fee779-0203-4fb9-b578-e824f609493d.json` (readiness READY: test·lint·plugin-validator)
- `03-do/evidence/diagram/vais-loop.html` · `desktop.png` · `mobile.png` (Chrome 캡처)
- `04-review/evidence/checks/secret-scan.json`
- 독립 QA handoff (`04-review/evidence/handoffs/`)
