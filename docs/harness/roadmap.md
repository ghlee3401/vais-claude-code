# VAIS 하네스 — 로드맵

> 출처: [design.md](design.md) 13절. 각 작업은 `/vais` Work item 하나로 진행하며 Plan → Design → Do → Review → Report 를 완주한다. 의존 작업이 Report 완료(frozen) 상태여야 다음 작업을 시작한다.

| # | 작업 (feature slug) | 규모 | 의존 | 내용 | 완료 조건 |
|---|---|---|---|---|---|
| H1 | `harness-health` | standard | 없음 | mode 정규화·fail-loud, 비상 스위치 `VAIS_HARNESS_OFF`, 읽기 명령·scratchpad 허용, lease·TTL·prefix 를 config 에서, slug 사용자 확인, router 평가 문장 제거, Plan 초안 경로 통일, 버전 도장 | doctor PASS, `Enforce` 입력 시 정상 동작, 회귀 세트 골격 |
| H2 | `chain-stages` | extended | H1 | `contracts/chain-stages.json`, `contracts/work-kinds.json`, `id-chain.js`, `stage present`, kind 진입 조건, specialist 산출물 직접 기록 | 장면 A 가 1~10 단계 문서로 끝까지 진행 |
| H3 | `product-note` | standard | H2 | 장부(`ledger.js`), 제품 노트 4면 렌더링, 세션 브리핑, 상태 줄, Stop 잠금, doctor | 장면 E 통과, `decisions.md` 자동 생성 |
| H4 | `ui-loop` | extended | H2, H3 | ui kind, 화면 확인 정지점, `screen-capture.js`, 검수 페이지, 전/후 비교, 취향 장부, 수정 5회 루프 | 장면 C 통과 |
| H5 | `commands` | standard | H3 | 상태·설명·저장·되돌리기·제안·기록 명령 | 명령 표대로 동작 |
| H6 | `feature-bug-kinds` | standard | H2, H4 | feature/bug kind, 인용 강제, stale Gate, 앱 실행 어댑터 | 장면 B·D 통과 |
| H7 | `regression-and-docs` | compact | H1~H6 | 회귀 세트 6 장면, README/ONBOARDING/CLAUDE 갱신, 버전 4.0.0, 플러그인 업데이트 | `npm run regression` PASS |
| H8 | `design-system-mcp` | compact | H4 | mcp/design-system/vendor 를 디자인 시스템 단계에 쓸지 결정·정리 | 유지 또는 삭제 결정 기록 |

## 진행 상태

| 작업 | 상태 | Work item |
|---|---|---|
| H1 | 완료 | `WI-2026-09-15-harness-health` (3.1.0) |
| H2 | 완료 | `WI-2026-09-16-chain-stages` (3.2.0) |
| H3 | 완료 | `WI-2026-09-16-product-note` (3.3.0) |
| H4 | 완료 | `WI-2026-09-16-ui-loop` (3.4.0) |
| H5 | 완료 | `WI-2026-09-16-commands` (3.5.0) |
| H6 | 완료 | `WI-2026-09-16-feature-bug-kinds` (3.6.0) |
| H7 | 완료 | `WI-2026-09-16-regression-and-docs` (4.0.0) |
| H8 | 완료 | `WI-2026-09-17-design-system-mcp` (4.0.1) — 삭제 결정 |

로드맵 H1~H8 종료 (2026-09-17). 이후 작업은 제품 사슬(`/vais 새 제품: …`)과 feature·bug·ui kind 로 진행하고, 하네스 자체 수정은 `harness` kind 로 한 건씩 한다.

## 자동 진행 — 범위 `unattended-chain` (2026-09-29, 장부 결정 LG-c98b7753 · 부채 LG-0775d07a)

| # | 작업 | 규모 | 의존 | 내용 | 완료 조건 |
|---|---|---|---|---|---|
| U1 | 마찰 제거 | standard | 없음 | 인가 TTL 을 휴지 시간으로(되살림), ID 형식 보정·Review TC 추가 경고·필수 절·안 한도 지시, 셸 조각 판정(리다이렉션 경로·scratchpad 스크립트·파괴 명령 목록), 여러 줄 기록 문구 정규화, `/vais 이름:` 세션 기억 | po_report 실패 13건 중 인가·형식 10건이 fixture 재현에서 사라짐, `npm test`·회귀·lint·validate PASS |
| U2 | 로그인 fixture | standard | U1 | `ui.run` 에 역할별 로그인 단계, 인증 뒤 화면 캡처, doctor 검사 | 기능 작업의 인증 화면 PNG 가 전부 찍힘 |
| U3 | 자동 진행 | extended | U1, U2 | 단계 kind 자동 승인, 사슬 orchestrator, 잠정 결정 큐, 사슬 실행 단위 인가, 세션 끊김 재개, 멈춤 조건 넷 | 장면 A 가 PRD 승인 뒤 사람 없이 10단계를 끝까지 진행 |
| U4 | 문서 9개와 확인점 | extended | U3 | 디자인 병합, 테스트 계획 자동 생성, SRD 추가, 확인점 3개 화면, 작성·검수 agent 분리와 PRD 대조 | 확인점 3개에서만 사용자가 부름 |

| 작업 | 상태 | Work item |
|---|---|---|
| U1 | 완료 | `WI-2026-09-29-unattended-chain` (4.4.0) |
| U2 | 대기 | — |
| U3 | 대기 | — |
| U4 | 대기 | — |
